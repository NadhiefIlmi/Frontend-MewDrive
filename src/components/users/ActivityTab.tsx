import { Clock, type LucideIcon } from "lucide-react";

type Activity = {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
  color: string;
};

const mockActivities: Activity[] = [];

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
