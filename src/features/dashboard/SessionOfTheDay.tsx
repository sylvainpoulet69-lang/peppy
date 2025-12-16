import { DateTime } from 'luxon';
import { GymConfig, SessionTemplate, WorkoutResult } from '../../types';

interface Props {
  session: SessionTemplate;
  gym: GymConfig;
  results: WorkoutResult[];
}

const formatSlot = (session: SessionTemplate, timezone: string) =>
  `${DateTime.fromISO(`${session.date}T${session.startTime}`, { zone: timezone }).toFormat('HH:mm')} - ${DateTime.fromISO(`${session.date}T${session.endTime}`, { zone: timezone }).toFormat('HH:mm')}`;

const SessionOfTheDay = ({ session, gym, results }: Props) => {
  const myResult = results.find((r) => r.sessionId === session.id);
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary-dark">Séance du jour</h2>
        <span className="pill">{session.type}</span>
      </div>
      <p className="text-sm text-secondary-gray">{formatSlot(session, gym.timezone)} · {session.location}</p>
      <p className="text-sm">{session.notes}</p>
      {myResult ? (
        <div className="bg-primary-light rounded-2xl p-3 text-sm text-primary-dark">
          <p className="font-semibold">Résultat enregistré</p>
          <p>{myResult.content}</p>
          {myResult.isPersonalRecord && <p className="text-green-700 mt-1">Nouveau record personnel détecté.</p>}
        </div>
      ) : (
        <p className="text-xs text-secondary-gray">Résultats accessibles à la fin de la séance. Les no-shows sont marqués.</p>
      )}
    </div>
  );
};

export default SessionOfTheDay;
