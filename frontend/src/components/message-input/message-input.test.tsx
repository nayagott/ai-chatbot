import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from './message-input';

describe('MessageInput', () => {
  it('입력값을 입력하고 전송 버튼을 클릭하면 onSend가 내용과 함께 호출된다', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} disabled={false} />);

    await user.type(screen.getByRole('textbox'), '안녕하세요');
    await user.click(screen.getByRole('button', { name: '전송' }));

    expect(onSend).toHaveBeenCalledWith('안녕하세요');
  });

  it('전송 후 입력창을 비운다', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} disabled={false} />);

    const textbox = screen.getByRole('textbox');
    await user.type(textbox, '안녕하세요');
    await user.click(screen.getByRole('button', { name: '전송' }));

    expect(textbox).toHaveValue('');
  });

  it('입력값이 비어 있으면 전송 버튼이 비활성화된다', () => {
    render(<MessageInput onSend={vi.fn()} disabled={false} />);

    expect(screen.getByRole('button', { name: '전송' })).toBeDisabled();
  });

  it('Enter 키를 누르면 전송된다', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} disabled={false} />);

    await user.type(screen.getByRole('textbox'), '안녕하세요{Enter}');

    expect(onSend).toHaveBeenCalledWith('안녕하세요');
  });

  it('disabled가 true이면 입력창과 전송 버튼이 비활성화된다', () => {
    render(<MessageInput onSend={vi.fn()} disabled={true} />);

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: '전송' })).toBeDisabled();
  });
});
