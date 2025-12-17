
import React from 'react';
import { Metadata } from '../types';
import { FileText, Database, BrainCircuit, Users, CheckCircle, Edit2, Tag } from 'lucide-react';

interface Props {
  metadata: Metadata | null;
  onUpdate: (data: Metadata) => void;
  onRate: () => void;
}

export const MetadataView: React.FC<Props> = ({ metadata, onUpdate, onRate }) => {
  if (!metadata) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p>请在左侧输入信息并点击生成</p>
        </div>
    );
  }

  const handleFieldChange = (key: keyof Metadata, value: any) => {
    onUpdate({ ...metadata, [key]: value });
  };

  const Section = ({ title, icon: Icon, children }: any) => (
    <div className="mb-6 last:mb-0 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase mb-4 pb-2 border-b border-slate-200">
            <Icon className="w-4 h-4 text-blue-500" /> {title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {children}
        </div>
    </div>
  );

  const EditableField = ({ 
    label, 
    fieldKey, 
    isLong = false, 
    isNumber = false, 
    isArray = false,
    full = false,
    placeholder
  }: { 
    label: string, 
    fieldKey: keyof Metadata, 
    isLong?: boolean, 
    isNumber?: boolean,
    isArray?: boolean,
    full?: boolean,
    placeholder?: string
  }) => {
    const value = metadata[fieldKey];
    
    // Convert display value
    let displayValue = value;
    if (isArray && Array.isArray(value)) {
        displayValue = value.join("、"); // Use Chinese comma for display
    }
    // Handle null/undefined
    if (displayValue === undefined || displayValue === null) displayValue = "";

    return (
        <div className={`${full ? 'col-span-1 md:col-span-2' : ''} group`}>
            <div className="flex items-center gap-1 mb-1">
                <span className="block text-xs font-semibold text-slate-500">{label}</span>
                <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {isLong ? (
                <textarea
                    className="w-full text-sm p-2 rounded border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[80px] text-slate-800 leading-relaxed"
                    value={displayValue as string}
                    onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                />
            ) : (
                <input
                    type={isNumber ? "number" : "text"}
                    step={isNumber ? "any" : undefined}
                    placeholder={placeholder}
                    className="w-full text-sm p-2 rounded border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800 font-medium"
                    value={displayValue as string | number}
                    onChange={(e) => {
                        let val: any = e.target.value;
                        if (isNumber) val = parseFloat(val);
                        if (isArray) val = (e.target.value as string).split(/[、,，]\s*/).filter(s => s.trim() !== "");
                        handleFieldChange(fieldKey, val);
                    }}
                />
            )}
        </div>
    )
  };

  return (
    <div className="h-full flex flex-col">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{metadata.indi_name_cn}</h3>
                    <p className="text-xs text-slate-500 mt-1">请检查并修改下方生成的元数据，确认无误后点击下方按钮进行评分。</p>
                </div>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">{metadata.indi_id}</span>
            </div>

            <Section title="基础信息 (规则生成)" icon={Database}>
                <EditableField label="英文标识 (Code)" fieldKey="indi_name_en" />
                <EditableField label="数据来源" fieldKey="src_name" />
                <EditableField label="数据源类型" fieldKey="src_type" />
                <EditableField label="更新频率" fieldKey="upd_freq" />
                <EditableField label="数据量 (选填)" fieldKey="data_volume" isNumber />
                <EditableField label="缺失率 (0-1)" fieldKey="miss_rate" isNumber />
            </Section>

            <Section title="分类与层级 (规则+AI)" icon={BrainCircuit}>
                 <EditableField label="指标分类 (Strict)" fieldKey="indi_cat" isArray full placeholder="行业数据、区域数据、企业数据、政策相关..." />
                 <EditableField label="数据颗粒层级" fieldKey="gran_level" full />
                 <EditableField label="涉及行业" fieldKey="industry" isArray full placeholder="如：钢铁、金融" />
                 <EditableField label="涉及企业 (单一主体)" fieldKey="involved_company" full placeholder="如：宝钢股份 (非必须)" />
            </Section>

            <Section title="语义增强 (AI生成)" icon={Tag}>
                 <EditableField label="指标增强标签" fieldKey="enhanced_tags" isArray full />
                 <EditableField label="指标定义" fieldKey="indi_def" isLong full />
            </Section>

            <Section title="应用指导 (AI生成)" icon={FileText}>
                <EditableField label="数据使用说明" fieldKey="data_usage_instructions" isLong full />
                <EditableField label="指标适用场景" fieldKey="main_scene" isArray full />
                <EditableField label="指标重要性" fieldKey="indi_imp" isLong full />
            </Section>
        </div>

        {/* Floating Bottom Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-100 flex justify-center">
            <button 
                onClick={onRate}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-green-600/30 flex items-center gap-2 transition-all transform hover:scale-105"
            >
                <CheckCircle className="w-5 h-5" />
                确认无误，开始 TAI 评级
            </button>
        </div>
    </div>
  );
};
