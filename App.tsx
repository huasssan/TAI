
import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { MetadataView } from './components/MetadataView';
import { TaiRating } from './components/TaiRating';
import { generateRuleBasedMetadata, calculateTaiRating } from './services/logicService';
import { enrichMetadataWithAI } from './services/geminiService';
import { IndicatorInput, Metadata, TaiScore } from './types';
import { LayoutGrid, Sparkles, Activity } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'metadata' | 'tai'>('metadata');
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [taiScore, setTaiScore] = useState<TaiScore | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1: Generate Metadata only
  const handleGenerate = async (input: IndicatorInput) => {
    setIsProcessing(true);
    setMetadata(null);
    setTaiScore(null);
    setActiveTab('metadata');

    try {
      // 1. Generate Deterministic Parts (Rules + Mock DB)
      const baseMeta = generateRuleBasedMetadata(input);

      // 2. Generate Semantic Parts (Gemini AI)
      const aiMeta = await enrichMetadataWithAI(input, baseMeta);

      // 3. Merge
      const fullMeta = { ...baseMeta, ...aiMeta } as Metadata;
      setMetadata(fullMeta);

    } catch (error) {
      console.error("Pipeline failed", error);
      alert("Failed to generate metadata");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Rate based on current (potentially edited) metadata
  const handleRate = () => {
    if (!metadata) return;
    const score = calculateTaiRating(metadata);
    setTaiScore(score);
    setActiveTab('tai');
  };

  const handleMetadataUpdate = (updatedMeta: Metadata) => {
    setMetadata(updatedMeta);
    // If we update metadata, invalidate the old score until they click rate again
    // setTaiScore(null); 
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20">
            <LayoutGrid className="w-6 h-6 text-white" />
        </div>
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">TAI数据层认证平台</h1>
            <p className="text-slate-500 text-sm">指标元数据自动生成与 TAI 可信认证系统</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
        
        {/* Left: Input */}
        <div className="lg:col-span-4 h-full">
          <InputForm onGenerate={handleGenerate} isProcessing={isProcessing} />
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-8 h-full bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('metadata')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'metadata' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              元数据预览 (Step 1)
            </button>
            <button
              onClick={() => taiScore && setActiveTab('tai')}
              disabled={!taiScore}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'tai' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                  : !taiScore 
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              TAI 评级 (Step 2)
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-hidden relative">
             {activeTab === 'metadata' ? (
                <MetadataView 
                    metadata={metadata} 
                    onUpdate={handleMetadataUpdate}
                    onRate={handleRate}
                />
             ) : (
                <TaiRating score={taiScore} />
             )}
          </div>

        </div>
      </main>
    </div>
  );
}
