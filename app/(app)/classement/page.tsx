import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type LeaderboardRow = {
  photo_id: string;
  owner_id: string;
  pseudo: string;
  avatar_url: string | null;
  storage_path: string;
  avg_score: string | number;
  vote_count: number;
};

const PODIUM_STYLE: Record<number, { border: string; step: string; size: string }> = {
  1: { border: "border-[#eec13b]", step: "bg-gradient-to-b from-[#f5d36b] to-[#eec13b] h-[58px]", size: "h-[68px] w-[68px]" },
  2: { border: "border-[#c6c6c8]", step: "bg-gradient-to-b from-[#e2e2e4] to-[#c6c6c8] h-[42px]", size: "h-[54px] w-[54px]" },
  3: { border: "border-[#cd8a52]", step: "bg-gradient-to-b from-[#e3a874] to-[#cd8a52] h-[36px]", size: "h-[54px] w-[54px]" },
};

export default async function ClassementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.rpc("get_weekly_leaderboard");
  const rows = ((data ?? []) as LeaderboardRow[]).map((r) => ({
    ...r,
    score: parseFloat(String(r.avg_score)),
  }));

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-8 text-center text-text-muted">
        Pas encore assez de votes cette semaine pour établir un classement (minimum 5 votes par photo).
      </div>
    );
  }

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 10);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto pb-8">
      <div className="flex items-end justify-center gap-3.5 px-4 pt-6">
        {podiumOrder.map((entry) => {
          if (!entry) return null;
          const rank = rows.indexOf(entry) + 1;
          const style = PODIUM_STYLE[rank];
          return (
            <div key={entry.photo_id} className="flex w-[76px] flex-col items-center gap-1.5">
              <span
                className={`block rounded-full border-[3px] bg-cover bg-center bg-bg-page ${style.border} ${style.size}`}
                style={entry.avatar_url ? { backgroundImage: `url(${entry.avatar_url})` } : undefined}
              />
              <span className="w-full truncate text-center text-[10.5px] font-bold text-text-faint">
                {entry.pseudo}
              </span>
              <span className="brand-text text-base font-extrabold italic">{entry.score.toFixed(1)}</span>
              <span
                className={`flex w-full items-start justify-center rounded-t-[10px] pt-1.5 text-sm font-extrabold text-[#17151c] ${style.step}`}
              >
                {rank}
              </span>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="flex flex-col px-4 pt-2.5">
          {rest.map((entry, i) => {
            const rank = i + 4;
            const isMe = entry.owner_id === user.id;
            return (
              <div
                key={entry.photo_id}
                className={`flex items-center gap-2.5 rounded-xl px-2 py-2.5 ${isMe ? "bg-bg-page" : ""}`}
              >
                <span className="w-4 flex-shrink-0 text-center text-xs font-bold text-text-faint">{rank}</span>
                <span
                  className="h-8 w-8 flex-shrink-0 rounded-full bg-bg-page bg-cover bg-center"
                  style={entry.avatar_url ? { backgroundImage: `url(${entry.avatar_url})` } : undefined}
                />
                <span className="flex-1 truncate text-sm font-bold text-text">
                  {isMe ? "Toi" : entry.pseudo}
                </span>
                <span className="flex-shrink-0 text-right">
                  <span className="brand-text block text-sm font-extrabold italic">{entry.score.toFixed(1)}</span>
                  <span className="block text-[10px] text-text-faint">{entry.vote_count} notes</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
