import { Clock, Upload, Download, FileText, Trash2, Edit3, Folder } from "lucide-react";

type Activity = {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  icon: typeof Upload;
  color: string;
};

const mockActivities: Activity[] = [
  {
    id: "1",
    action: "File Uploaded",
    description: "Brand Guidelines.pdf diunggah",
    timestamp: "2 jam yang lalu",
    icon: Upload,
    color: "bg-lime",
  },
  {
    id: "2",
    action: "File Downloaded",
    description: "Project Plan.docx didownload",
    timestamp: "5 jam yang lalu",
    icon: Download,
    color: "bg-sky",
  },
  {
    id: "3",
    action: "File Edited",
    description: "Meeting Notes.txt diedit",
    timestamp: "Kemarin, 14:30",
    icon: Edit3,
    color: "bg-lilac",
  },
  {
    id: "4",
    action: "Folder Created",
    description: "Folder 'Marketing' dibuat",
    timestamp: "Kemarin, 10:15",
    icon: Folder,
    color: "bg-sun",
  },
  {
    id: "5",
    action: "File Deleted",
    description: "Old Report.pdf dihapus",
    timestamp: "2 hari yang lalu",
    icon: Trash2,
    color: "bg-coral",
  },
  {
    id: "6",
    action: "File Uploaded",
    description: "Budget Q4.xlsx diunggah",
    timestamp: "3 hari yang lalu",
    icon: Upload,
    color: "bg-lime",
  },
  {
    id: "7",
    action: "File Downloaded",
    description: "Design Mockup.png didownload",
    timestamp: "3 hari yang lalu",
    icon: Download,
    color: "bg-sky",
  },
  {
    id: "8",
    action: "File Edited",
    description: "README.md diedit",
    timestamp: "4 hari yang lalu",
    icon: Edit3,
    color: "bg-lilac",
  },
];

export function ActivityTab({ userId }: { userId: number }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 font-display text-2xl font-bold">
          Activity Log
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Riwayat aktivitas user dalam sistem
        </p>
      </div>

      {mockActivities.length === 0 ? (
        <div className="rounded-ui border-2 border-dashed border-ink bg-background p-10 text-center">
          <Clock className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 font-display text-xl font-bold">
            Belum ada aktivitas
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aktivitas user akan muncul di sini
          </p>
        </div>
      ) : (
        <div className="relative space-y-0">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-ink" />

          {/* Activity Items */}
          {mockActivities.map((activity, index) => (
            <div key={activity.id} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Icon */}
              <div className="relative z-10">
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-full border-2 border-ink ${activity.color}`}
                >
                  <activity.icon className="size-5" />
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 rounded-ui border-2 border-ink bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{activity.action}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {activity.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {mockActivities.length > 0 && (
        <div className="flex justify-center pt-4">
          <button className="rounded-ui border-2 border-ink bg-card px-6 py-2 font-bold hover:bg-sun transition-colors">
            Load More Activities
          </button>
        </div>
      )}
    </div>
  );
}
