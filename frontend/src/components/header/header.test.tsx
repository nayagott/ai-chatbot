import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './header';

// FR-FE-008: Header (A/F: 로고/제목, 모바일 햄버거)
// docs/IMPLEMENTATION_PLAN.md 참조.

describe('Header', () => {
  it('제목을 렌더링한다', () => {
    render(<Header title="AI 챗봇" onToggleSidebar={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'AI 챗봇' })).toBeInTheDocument();
  });

  it('햄버거 버튼을 클릭하면 onToggleSidebar가 호출된다', async () => {
    const user = userEvent.setup();
    const onToggleSidebar = vi.fn();
    render(<Header title="AI 챗봇" onToggleSidebar={onToggleSidebar} />);

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));

    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });
});
