'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiStories } from '@/data/dashboardData';
import { Sparkles, MapPin, Calendar, ChevronRight, BookOpen } from 'lucide-react';

export function AIStories() {
  const [selectedStory, setSelectedStory] = useState(aiStories[0]);

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent-500/10 rounded-lg">
          <Sparkles className="text-accent-400" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Historias Generadas por IA</h3>
          <p className="text-dark-400 text-sm">El viaje de tus paneles reciclados</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {aiStories.map((story) => (
          <button
            key={story.id}
            onClick={() => setSelectedStory(story)}
            className={`p-4 rounded-xl text-left transition-all ${
              selectedStory.id === story.id
                ? 'bg-accent-500/20 border border-accent-500/50'
                : 'bg-dark-700 border border-dark-600 hover:border-dark-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-accent-400" />
              <span className="text-xs text-dark-400">Historia</span>
            </div>
            <h4 className={`font-medium line-clamp-1 ${
              selectedStory.id === story.id ? 'text-accent-400' : 'text-white'
            }`}>
              {story.title}
            </h4>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedStory.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-6 bg-dark-700 rounded-xl"
        >
          <h4 className="text-xl font-semibold text-white mb-4">{selectedStory.title}</h4>
          
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <span className="flex items-center gap-2 text-dark-400">
              <MapPin size={14} />
              {selectedStory.panelOrigin}
            </span>
            <span className="flex items-center gap-2 text-dark-400">
              <Calendar size={14} />
              {selectedStory.generatedAt.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <p className="text-dark-300 leading-relaxed whitespace-pre-line">
            {selectedStory.content}
          </p>

          <div className="mt-6 pt-4 border-t border-dark-600">
            <button className="flex items-center gap-2 text-accent-400 hover:text-accent-300 transition-colors text-sm font-medium">
              Generar nueva historia
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
