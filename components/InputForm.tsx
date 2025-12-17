
import React, { useState } from 'react';
import { IndicatorInput } from '../types';
import { Loader2, Play } from 'lucide-react';

interface Props {
  onGenerate: (input: IndicatorInput) => void;
  isProcessing: boolean;
}

export const InputForm: React.FC<Props> = ({ onGenerate, isProcessing }) => {
  const [formData, setFormData] = useState<IndicatorInput>({
    name: "粗钢吨钢碳排放量",
    sourceName: "生态环境部",
    missRate: "",
    dataVolume: "" 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const inputClass = "w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400";

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
        第一步：定义指标
      </h2>
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
        
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            指标中文名称 <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            required
            className={inputClass}
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="例如：日活跃用户数"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            数据来源 <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            required
            className={inputClass}
            value={formData.sourceName}
            onChange={e => setFormData({...formData, sourceName: e.target.value})}
            placeholder="例如：国家统计局"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                缺失率 % (选填)
              </label>
              <input 
                type="number"
                min="0"
                max="100"
                step="0.01"
                className={inputClass}
                value={formData.missRate}
                onChange={e => setFormData({...formData, missRate: e.target.value})}
                placeholder="例: 0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                数据量 (选填)
              </label>
              <input 
                type="number"
                min="0"
                className={inputClass}
                value={formData.dataVolume}
                onChange={e => setFormData({...formData, dataVolume: e.target.value})}
                placeholder="例: 10000"
              />
            </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-[-10px]">若不填，系统将默认为0或不涉及</p>

        <div className="mt-auto pt-6">
            <button 
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        元数据生成中...
                    </>
                ) : (
                    <>
                        <Play className="w-5 h-5 fill-current" />
                        生成元数据
                    </>
                )}
            </button>
            <p className="text-xs text-slate-400 mt-3 text-center">
                点击生成后，可在右侧预览并手动修改字段<br/>最后点击评分按钮获取 TAI 报告
            </p>
        </div>

      </form>
    </div>
  );
};
