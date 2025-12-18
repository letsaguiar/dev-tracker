import React, { useState } from 'react';
import { useDailyStore } from '../store/useDailyStore';
import { useTaskStore } from '../store/useTaskStore';

const DayTransitionModal: React.FC = () => {
    const {
        isDayReviewNeeded,
        setDayReviewNeeded,
        startDay,
        startTime,
        desiredEndTime,
        actualEndTime,
        setStartTime,
        setDesiredEndTime,
        setActualEndTime,
        todayGoals,
        codeReviews,
        toggleCodeReview
    } = useDailyStore();

    const { updateTask, toggleSubtask, tasks } = useTaskStore();

    const [step, setStep] = useState(1);

    if (!isDayReviewNeeded) return null;

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleFinish = () => {
        startDay();
        setDayReviewNeeded(false);
        setStep(1);
    };

    const getTaskTitle = (taskId: string, subtaskId?: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return 'Unknown Task';
        if (!subtaskId) return task.title;
        const sub = task.subtasks.find(s => s.id === subtaskId);
        return sub ? `${sub.title} (via ${task.title})` : task.title;
    };

    const isSubtaskCompleted = (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        const sub = task?.subtasks.find(s => s.id === subtaskId);
        return sub?.completed;
    }

    const isTaskCompleted = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        return task?.status === 'Done';
    }


    const toggleGoalCompletion = (goal: any) => {
        if (goal.type === 'subtask') {
            toggleSubtask(goal.taskId, goal.id);
        } else {
            const task = tasks.find(t => t.id === goal.taskId);
            if (task) {
                const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
                updateTask(goal.taskId, { status: newStatus as any });
            }
        }
    };


    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 bg-indigo-600 text-white">
                    <h2 className="text-2xl font-bold">End of Day Review</h2>
                    <p className="opacity-80 text-sm">Wrap up your day before starting a new one.</p>
                </div>

                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Step 1: Review Times</h3>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                    <input
                                        type="time"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 border p-2"
                                        value={startTime || ''}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Desired End Time</label>
                                    <input
                                        type="time"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 border p-2"
                                        value={desiredEndTime || ''}
                                        onChange={(e) => setDesiredEndTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Actual End Time</label>
                                    <input
                                        type="time"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 border p-2"
                                        value={actualEndTime || ''}
                                        onChange={(e) => setActualEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Step 2: Review Goals</h3>
                            <p className="text-sm text-gray-500">Check off any goals you completed.</p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {todayGoals.length === 0 && <p className="text-gray-400 italic">No goals set for today.</p>}
                                {todayGoals.map((goal) => {
                                    const completed = goal.type === 'subtask'
                                        ? isSubtaskCompleted(goal.taskId, goal.id)
                                        : isTaskCompleted(goal.taskId);

                                    return (
                                        <div key={goal.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={!!completed}
                                                onChange={() => toggleGoalCompletion(goal)}
                                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className={completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                                                {getTaskTitle(goal.taskId, goal.type === 'subtask' ? goal.id : undefined)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Step 3: Code Reviews</h3>
                            <p className="text-sm text-gray-500">Update status of code reviews.</p>
                            <div className="space-y-2">
                                {codeReviews.length === 0 && <p className="text-gray-400 italic">No code reviews tracked.</p>}
                                {codeReviews.map((review) => (
                                    <div key={review.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg justify-between">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={review.completed}
                                                onChange={() => toggleCodeReview(review.id)}
                                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className={review.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                                                {review.title}
                                            </span>
                                        </div>
                                        {review.url && (
                                            <a href={review.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">
                                                Link
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 flex justify-between">
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Finish Day
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayTransitionModal;
