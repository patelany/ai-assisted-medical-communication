"use client";

export default function StudyComplete({
  participantId,
}: {
  participantId: string;
}) {
  return (
    <div className="max-w-md mx-auto py-20 px-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">Thank you</h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-6">
        Your responses have been recorded anonymously. Your participation
        contributes to research on AI-assisted medical communication that
        could help families during difficult times.
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Your participant ID</p>
        <p className="font-mono text-lg text-gray-700">{participantId}</p>
        <p className="text-xs text-gray-400 mt-1">
          Reference this if you have questions about your submission.
        </p>
      </div>
    </div>
  );
}