
import { GoogleGenAI, Type } from "@google/genai";
import { Metadata, IndicatorInput } from "../types";

/**
 * Dynamically builds the System Prompt based on the logic provided.
 */
const buildSystemPrompt = (indicatorInfo: { 
    name: string, 
    source: string, 
    granularity: string, 
    categories: string[] 
}) => {
    
    // Base Prompt
    let prompt = `
# Role
你是一名专业的数据治理专家和高级数据分析师。你擅长理解业务指标,并能为这些指标精确地生成符合规范的元数据。

# Task
你的任务是接收"指标信息",然后根据我提供的"字段生成指南",为该指标生成一个格式严谨的JSON对象。

# 输出说明
你的输出必须且只能是一个格式完整的JSON对象,不要包含任何其他文字说明。
JSON的键(key)必须是我在指南中定义的字段名。
JSON的值(value)必须严格遵循指南中的定义、枚举选项和数据类型。对于Array[String]类型,如果无适用内容,请返回空数组[]。
    `;

    const isQualitative = indicatorInfo.categories.some(cat => 
        ["政策相关", "新闻相关", "研报相关"].includes(cat)
    );

    if (isQualitative) {
        prompt += `
# 字段生成指南 (定性/文本类指标)

## 1. 【数据使用说明】 (data_usage_instructions)
- 定义：为大模型提供操作性指导，明确该文本类信息在分析或推理任务中的具体使用方式与边界。
- 说明：由于该指标为政策、新闻或研报等文本类信息相关指标，你需要从“逻辑应用”而非“数值计算”的角度，指导AI如何使用。

## 2. 【指标适用场景】 (main_scene)
- 定义：数据的主要适用场景或业务应用领域，描述指标适用的具体领域。
- 说明：请生成2–5个中性名词或词组（2–8字），用于描述该指标的主要分析场景或决策语境。
`;
    } else {
        prompt += `
# 字段生成指南 (定量指标)

## 1. 【指标解释】 (indi_def)
- 定义：说明指标的业务含义。
- 说明：请仅基于输入的input来生成解释,严禁包含任何你无法确认真实性的信息。

## 2. 【指标增强标签】 (enhanced_tags)
- 定义：指标增强标签用于为每个指标建立多维度的语义标识体系，指标的标签或关键词，用于分类和快速检索指标。
- 说明：从不同维度生成3-6个增强标签。

## 3. 【数据使用说明】 (data_usage_instructions)
- 定义：说明指标的功能逻辑、分析方法、依赖搭配、使用边界与注意事项。

## 4. 【指标适用场景】 (main_scene)
- 定义：描述指标适用的具体业务领域或分析任务。
- 当前指标的【数据颗粒层级】为 **${indicatorInfo.granularity}**。
- 说明：基于此信息，生成2–5个中性名词或词组（2–8字）。
    - L1 (微观): 聚焦单一对象（企业、产品）的内部诊断与评估。
    - L2 (中观): 聚焦行业、产业链或特定群体的趋势与结构分析。
    - L3 (宏观): 聚焦全局性的社会、经济运行状况分析。

`;

        const isIndustrySpecific = indicatorInfo.categories.includes("行业数据");
        
        if (isIndustrySpecific) {
             prompt += `
## 5. 【指标重要性】 (indi_imp)
- 定义：衡量指标在业务决策中的影响程度和关注优先级的定性或定量标签。
- 说明：解释“为什么这个指标很重要”。
`;
        } else {
             prompt += `
## 5. 【指标重要性】 (indi_imp)
- 定义：论证该指标在业务决策中的价值和影响程度。
- 说明：解释“为什么这个指标很重要”。
`;
        }
    }

    // Common fields
    prompt += `
## 6. 其他基础字段
- 【英文标识】(indi_name_en): Snake case 风格。
- 【涉及企业】(involved_company): 字符串类型。如果是【企业数据】或明确涉及某个特定企业的指标，请填写该企业简称（仅限1个）。如果该指标是行业通用指标，不涉及特定单一企业，请务必返回 "不涉及"。
- 【涉及行业】(industry): 数组，该指标所属的行业。
`;

    return prompt;
};

export const enrichMetadataWithAI = async (
  baseInput: IndicatorInput,
  currentMetadata: Partial<Metadata>
): Promise<Partial<Metadata>> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("No API Key found. Returning mock AI data.");
        return getMockAiData(baseInput);
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = buildSystemPrompt({
        name: baseInput.name,
        source: baseInput.sourceName,
        granularity: currentMetadata.gran_level || "L2 (中观层级)",
        categories: currentMetadata.indi_cat || []
    });

    const userPrompt = `
    指标名称: ${baseInput.name}
    数据来源: ${baseInput.sourceName}
    已确定的分类: ${currentMetadata.indi_cat?.join(", ")}
    已确定的颗粒度: ${currentMetadata.gran_level}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            industry: { type: Type.ARRAY, items: { type: Type.STRING } },
            involved_company: { type: Type.STRING }, // Single string
            indi_name_en: { type: Type.STRING },
            indi_def: { type: Type.STRING },
            enhanced_tags: { type: Type.ARRAY, items: { type: Type.STRING } }, 
            data_usage_instructions: { type: Type.STRING },
            main_scene: { type: Type.ARRAY, items: { type: Type.STRING } },
            indi_imp: { type: Type.STRING },
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini API Error:", error);
    return getMockAiData(baseInput);
  }
};

const getMockAiData = (input: IndicatorInput): Partial<Metadata> => {
    return {
        industry: ["通用行业"],
        involved_company: "不涉及",
        indi_name_en: "mock_indicator_code",
        indi_def: `基于该指标${input.name}的标准定义。`,
        enhanced_tags: ["统计", "分析", "示例标签"],
        data_usage_instructions: "建议用于趋势分析。",
        main_scene: ["市场分析", "绩效评估"],
        indi_imp: "具有一定参考价值。",
    };
}
