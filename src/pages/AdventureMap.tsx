import React from 'react';
import { Link } from 'react-router-dom';
import { quests } from '../data';
import { useAppState } from '../store';
import { AppScreen, ProgressBar, ScreenHeader } from '../ui';

const destinations = [
  { name: 'Treasure Trail', topic: 'Addition Island', position: 'node-1', questId: quests[0].id },
  { name: 'Cave of Clues', topic: 'Number Desert', position: 'node-2', questId: quests[1].id },
  { name: 'Boss Map', topic: 'Ratio River', position: 'node-3', questId: quests[2].id },
  { name: 'Geometry City', topic: 'Coming soon', position: 'node-4' },
  { name: 'Problem Dungeon', topic: 'Coming soon', position: 'node-5' },
  { name: 'Algebra Castle', topic: 'Coming soon', position: 'node-6' },
];

const AdventureMap: React.FC = () => {
  const { state } = useAppState();
  const completed = state.completedQuestIds.length;

  return (
    <AppScreen className="adventure-map-screen">
      <ScreenHeader
        title="Adventure Map"
        subtitle="Follow the trail, solve every challenge, and unlock the island."
        showBack
        right={<span className="map-progress-chip">{completed}/6 cleared</span>}
      />

      <div className="adventure-map-stage">
        {destinations.map((destination, index) => {
          const locked = !destination.questId;
          const done = destination.questId ? state.completedQuestIds.includes(destination.questId) : false;
          const className = `map-node ${destination.position} ${locked ? 'locked' : ''} ${done ? 'done' : ''}`;
          const content = (
            <>
              <b>{locked ? 'Locked' : done ? 'Cleared' : index + 1}</b>
              <span>{destination.name}</span>
              <small>{destination.topic}</small>
            </>
          );

          return locked ? (
            <div className={className} key={destination.name}>{content}</div>
          ) : (
            <Link className={className} key={destination.name} to={`/quiz/${destination.questId}`}>{content}</Link>
          );
        })}
      </div>

      <article className="map-journey-card">
        <div>
          <span>Island progress</span>
          <strong>{Math.round((completed / destinations.length) * 100)}%</strong>
        </div>
        <ProgressBar value={(completed / destinations.length) * 100} tone="gold" />
        <p>Complete the first three missions to prepare for Geometry City.</p>
      </article>
    </AppScreen>
  );
};

export default AdventureMap;
