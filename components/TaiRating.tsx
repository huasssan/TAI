
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { TaiScore, TaiLevel } from '../types';
import { ShieldCheck, TrendingUp, Search, Info, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  score: TaiScore | null;
}

export const TaiRating: React.FC<Props> = ({ score }) => {
  if (!score) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <ShieldCheck className="w-16 h-16 mb-4 opacity-20" />
        <p>请在“元数据预览”页确认信息后点击评级</p>
      </div>
    );
  }

  const data = [
    { subject: '可用性', A: score.dimensions.availability, fullMark: 10 },
    { subject: '可信度', A: score.dimensions.credibility, fullMark: 10 },
    { subject: '业务匹配', A: score.dimensions.businessMatch, fullMark: 10 },
  ];

  const getBadgeColor = (level: TaiLevel) => {
    switch (level) {
        case TaiLevel.TAI3: return "bg-green-100 text-green-700 border-green-200";
        case TaiLevel.TAI2: return "bg-blue-100 text-blue-700 border-blue-200";
        case TaiLevel.TAI1: return "bg-yellow-100 text-yellow-700 border-yellow-200";
        default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex justify-between items-start mb-6">
        <div>
            <h3 className="text-lg font-semibold text-slate-800">TAI 可信度评级结果</h3>
            <p className="text-sm text-slate-500">Trustworthy AI Data Quality Framework</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border-2 font-bold text-xl flex flex-col items-center justify-center min-w-[100px] ${getBadgeColor(score.level)}`}>
            {score.level}
            <span className="text-[10px] font-normal opacity-80 uppercase tracking-wider">Rating</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Radar Chart */}
        <div className="h-[250px] relative bg-slate-50 rounded-lg border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar
                name="TAI Score"
                dataKey="A"
                stroke="#2563eb"
                fill="#3b82f6"
                fillOpacity={0.5}
                />
            </RadarChart>
            </ResponsiveContainer>
        </div>

        {/* Key Drivers */}
        <div>
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> 
                关键得分因素
            </h4>
            <div className="flex flex-wrap gap-2 mb-6">
                {score.details.map((d, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-full shadow-sm flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" /> {d}
                    </span>
                ))}
                {score.details.length === 0 && <span className="text-xs text-slate-400 italic">无显著特征</span>}
            </div>
            
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">维度得分详情</h4>
            <div className="space-y-3">
                 {[
                     { label: '可用性 (Availability)', score: score.dimensions.availability, color: 'bg-blue-500', icon: Search, desc: '完整性 > 6分' },
                     { label: '可信度 (Credibility)', score: score.dimensions.credibility, color: 'bg-green-500', icon: ShieldCheck, desc: 'L3(10) / L2(8) / L1(6)' },
                     { label: '业务匹配 (Match)', score: score.dimensions.businessMatch, color: 'bg-purple-500', icon: TrendingUp, desc: '场景/行业/公司' },
                 ].map((item, idx) => (
                     <div key={idx} className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-slate-400" />
                        <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-700 font-medium">{item.label}</span>
                                <span className="text-slate-500 font-bold">{item.score}<span className="text-slate-400 font-normal">/10</span></span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.score * 10}%` }}></div>
                            </div>
                        </div>
                     </div>
                 ))}
            </div>
        </div>
      </div>

      {/* Explanations */}
      <div className="border-t border-slate-100 pt-6">
         <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            TAI 等级映射标准
         </h4>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${score.level === TaiLevel.TAI3 ? 'bg-green-50 border-green-200 ring-1 ring-green-300 shadow-sm' : 'bg-white border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${score.level === TaiLevel.TAI3 ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                    <h5 className="font-bold text-slate-800">TAI-3 (数据权威)</h5>
                </div>
                <p className="text-xs text-slate-600 mb-2 font-medium">数据权威、治理完善</p>
                <div className="space-y-1">
                    <Requirement label="可信度" value="10分 (L3)" met={score.dimensions.credibility === 10} />
                    <Requirement label="可用性" value="> 6分" met={score.dimensions.availability > 6} />
                    <Requirement label="匹配度" value="≥ 3分" met={score.dimensions.businessMatch >= 3} />
                </div>
            </div>

            <div className={`p-4 rounded-lg border ${score.level === TaiLevel.TAI2 ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300 shadow-sm' : 'bg-white border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${score.level === TaiLevel.TAI2 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                    <h5 className="font-bold text-slate-800">TAI-2 (数据适用)</h5>
                </div>
                <p className="text-xs text-slate-600 mb-2 font-medium">数据适用、完整</p>
                <div className="space-y-1">
                    <Requirement label="可信度" value="≥ 6分" met={score.dimensions.credibility >= 6} />
                    <Requirement label="可用性" value="> 6分" met={score.dimensions.availability > 6} />
                    <Requirement label="匹配度" value="≥ 3分" met={score.dimensions.businessMatch >= 3} />
                </div>
            </div>

            <div className={`p-4 rounded-lg border ${score.level === TaiLevel.TAI1 ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-300 shadow-sm' : 'bg-white border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${score.level === TaiLevel.TAI1 ? 'bg-yellow-500' : 'bg-slate-300'}`}></span>
                    <h5 className="font-bold text-slate-800">TAI-1 (数据可用)</h5>
                </div>
                <p className="text-xs text-slate-600 mb-2 font-medium">数据可用、可信</p>
                <div className="space-y-1">
                    <Requirement label="可信度" value="≥ 6分" met={score.dimensions.credibility >= 6} />
                    <Requirement label="可用性" value="无严格要求" met={true} />
                    <Requirement label="匹配度" value="无严格要求" met={true} />
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const Requirement = ({ label, value, met }: { label: string, value: string, met: boolean }) => (
    <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-500">{label}</span>
        <div className="flex items-center gap-1">
            <span className={`font-mono ${met ? 'text-slate-700' : 'text-slate-400'}`}>{value}</span>
            {met ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-slate-300" />}
        </div>
    </div>
);
