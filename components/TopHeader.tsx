import LogoutButton from "./LogoutButton";

export default function TopHeader() {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <span className="brand-text text-[19px]">Cote</span>
      <LogoutButton />
    </div>
  );
}
