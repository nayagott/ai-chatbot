interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
}

export function Header({ title, onToggleSidebar }: HeaderProps) {
  return (
    <header>
      <h1>{title}</h1>
      <button type="button" aria-label="메뉴 열기" onClick={onToggleSidebar}>
        ☰
      </button>
    </header>
  );
}
