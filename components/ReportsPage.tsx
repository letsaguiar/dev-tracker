import React, { useState, useRef, useEffect } from 'react';
import { useDailyStore } from '../store/useDailyStore';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from './ui/Common';
import { FileDown, Calendar as CalendarIcon, Clock, CheckCircle, List, FileType } from 'lucide-react';
import { DailyReport } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ReportsPage: React.FC = () => {
    const { history, startTime, actualEndTime, ruleOfThree, codeReviews, pomodoroSessions } = useDailyStore();
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Hidden ref for PDF generation
    const printRef = useRef<HTMLDivElement>(null);

    // 1. Construct Today's Report (Dynamic)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayReport: DailyReport = {
        id: 'current',
        date: new Date().toISOString(),
        startTime,
        endTime: actualEndTime || 'In Progress', // Show status if not clocked out
        desiredEndTime: null,
        ruleOfThree,
        codeReviews: codeReviews.filter(cr => cr.completed),
        pomodoroSessions,
        summary: '',
    };

    // 2. Combine Sources (History + Today)
    // Filter history to remove any potential duplicate for today (though unlikely with current logic)
    const safeHistory = history.filter(h => h.date.split('T')[0] !== todayStr);
    const allReports = [todayReport, ...safeHistory];

    // 3. View Logic
    const isTodaySelected = selectedDate === todayStr;
    const currentReport = isTodaySelected ? todayReport : history.find(r => r.date.startsWith(selectedDate));

    // 4. Download Logic
    const handleDownloadPDF = async () => {
        if (!startDate || !endDate) return;
        setIsGeneratingPdf(true);

        // Allow DOM to update with the print view
        setTimeout(async () => {
            if (printRef.current) {
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 10; // 10mm margin on each side

                const elements = printRef.current.querySelectorAll('.page-break-inside-avoid');
                let yOffset = margin;

                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i] as HTMLElement;
                    const canvas = await html2canvas(element, { scale: 2, logging: false });
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = canvas.width;
                    const imgHeight = canvas.height;

                    const finalWidth = pdfWidth - (2 * margin);
                    const finalHeight = (imgHeight * finalWidth) / imgWidth;

                    if (yOffset + finalHeight > pdfHeight - margin && i > 0) {
                        pdf.addPage();
                        yOffset = margin;
                    }

                    pdf.addImage(imgData, 'PNG', margin, yOffset, finalWidth, finalHeight);
                    yOffset += finalHeight + margin; // Add some space between reports
                }

                pdf.save(`daily_report_${startDate}_to_${endDate}.pdf`);
            }
            setIsGeneratingPdf(false);
        }, 100);
    };

    // Filter reports for the print view
    const reportsToPrint = allReports.filter(r => {
        const rDate = r.date.split('T')[0];
        return rDate >= startDate && rDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

    return (
        <div className="max-w-5xl mx-auto space-y-8 relative">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Daily Reports</h2>
                    <p className="text-muted-foreground">Review your past performance and work history.</p>
                </div>

                <div className="flex items-center gap-2 bg-card border rounded-md p-1 shadow-sm">
                    <CalendarIcon className="w-4 h-4 ml-2 text-muted-foreground" />
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border-0 focus-visible:ring-0 w-auto bg-transparent"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main View */}
                <div className="lg:col-span-2 space-y-6">
                    {currentReport ? (
                        <ReportDetailView report={currentReport} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-card/50">
                            <div className="bg-secondary/50 p-4 rounded-full mb-4">
                                <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No Report Found</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mt-2">
                                There is no daily report recorded for <span className="font-mono text-foreground">{selectedDate}</span>.
                                Change the date or "End Day" to generating one.
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileDown className="w-5 h-5 text-primary" /> Export Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">From</label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">To</label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                            <Button
                                className="w-full"
                                onClick={handleDownloadPDF}
                                disabled={!startDate || !endDate || isGeneratingPdf}
                            >
                                {isGeneratingPdf ? 'Generating...' : <><FileType className="w-4 h-4 mr-2" /> Download PDF</>}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider">Total History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{allReports.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Days recorded (including today)</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Hidden Print Container */}
            {isGeneratingPdf && (
                <div className="absolute top-0 left-0 bg-white z-[-50] w-[800px] p-8 space-y-8 text-black" ref={printRef}>
                    <div className="text-center border-b pb-4 mb-8">
                        <h1 className="text-3xl font-bold text-black">DevTracker Activity Report</h1>
                        <p className="text-gray-500">{startDate} - {endDate}</p>
                    </div>
                    {reportsToPrint.length === 0 ? (
                        <div className="text-center italic text-gray-500">No reports found for this period.</div>
                    ) : (
                        reportsToPrint.map(report => (
                            <div key={report.id} className="mb-8 border-b pb-8 last:border-0 page-break-inside-avoid">
                                <h2 className="text-xl font-bold mb-4 bg-gray-100 p-2">{new Date(report.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                                <ReportDetailView report={report} isPrint />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// Sub-component for rendering a single report, reused for View and Print
const ReportDetailView: React.FC<{ report: DailyReport, isPrint?: boolean }> = ({ report, isPrint = false }) => {
    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className={isPrint ? "border shadow-none" : ""}>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Start Time</span>
                        <div className="text-lg font-mono font-semibold">{report.startTime || '--:--'}</div>
                    </CardContent>
                </Card>
                <Card className={isPrint ? "border shadow-none" : ""}>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">End Time</span>
                        <div className="text-lg font-mono font-semibold">{report.endTime || '--:--'}</div>
                    </CardContent>
                </Card>
                <Card className={isPrint ? "border shadow-none" : ""}>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Focus Sessions</span>
                        <div className="text-lg font-mono font-semibold">{report.pomodoroSessions?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card className={isPrint ? "border shadow-none" : ""}>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">PRs Done</span>
                        <div className="text-lg font-mono font-semibold">{report.codeReviews?.length || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className={isPrint ? "border shadow-none" : ""}>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" /> Rule of 3 Outcomes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {report.ruleOfThree && report.ruleOfThree.map((rule, idx) => (
                            <li key={idx} className="flex gap-3 items-start">
                                <span className="bg-secondary text-secondary-foreground font-mono text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    #{idx + 1}
                                </span>
                                <span className={rule ? "text-foreground" : "text-muted-foreground italic"}>
                                    {rule || "No outcome set"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className={isPrint ? "border shadow-none" : ""}>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <List className="w-5 h-5 text-primary" /> Work Log
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Completed Code Reviews</h4>
                        {report.codeReviews && report.codeReviews.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {report.codeReviews.map(cr => (
                                    <li key={cr.id}>
                                        {cr.url ? (
                                            <a href={cr.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{cr.title}</a>
                                        ) : cr.title}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No code reviews completed.</p>
                        )}
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Focus Sessions</h4>
                        {report.pomodoroSessions && report.pomodoroSessions.length > 0 ? (
                            <div className="space-y-2">
                                {report.pomodoroSessions.map(session => (
                                    <div key={session.id} className="flex items-center justify-between text-sm p-2 bg-secondary/20 rounded border border-border/50">
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="font-medium truncate ml-4 flex-1 text-right">Task Ref: {session.taskId}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No focus sessions recorded.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {report.summary && (
                <Card className={isPrint ? "border shadow-none" : ""}>
                    <CardHeader>
                        <CardTitle className="text-lg">Daily Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm">{report.summary}</p>
                    </CardContent>
                </Card>
            )}
        </>
    );
};

export default ReportsPage;
