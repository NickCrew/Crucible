import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagInput } from '../tag-input';

// ── TASK-18: TagInput component behavior ────────────────────────────

describe('TagInput', () => {
  const defaultProps = {
    label: 'Tags',
    tags: [] as string[],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds trimmed tag on Enter key press', () => {
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Type and press Enter');
    fireEvent.change(input, { target: { value: '  security  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['security']);
  });

  it('adds tag on input blur', () => {
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Type and press Enter');
    fireEvent.change(input, { target: { value: 'auth' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(['auth']);
  });

  it('prevents duplicate tags', () => {
    const onChange = vi.fn();
    render(
      <TagInput {...defaultProps} tags={['existing']} onChange={onChange} />,
    );

    const input = screen.getByPlaceholderText('Type and press Enter');
    fireEvent.change(input, { target: { value: 'existing' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // onChange should NOT be called with the duplicate
    expect(onChange).not.toHaveBeenCalledWith(expect.arrayContaining(['existing', 'existing']));
  });

  it('removes tag on X button click', () => {
    const onChange = vi.fn();
    render(
      <TagInput {...defaultProps} tags={['alpha', 'beta']} onChange={onChange} />,
    );

    const removeButton = screen.getByLabelText('Remove alpha');
    fireEvent.click(removeButton);

    expect(onChange).toHaveBeenCalledWith(['beta']);
  });

  it('backspace on empty input removes and populates last tag', () => {
    const onChange = vi.fn();
    render(
      <TagInput {...defaultProps} tags={['first', 'second']} onChange={onChange} />,
    );

    const input = screen.getByPlaceholderText('Type and press Enter');
    // Input is empty, press backspace
    fireEvent.keyDown(input, { key: 'Backspace' });

    // Should remove last tag from array
    expect(onChange).toHaveBeenCalledWith(['first']);
  });

  it('does not add empty tag', () => {
    const onChange = vi.fn();
    render(<TagInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Type and press Enter');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders existing tags as badges', () => {
    render(
      <TagInput {...defaultProps} tags={['tag-1', 'tag-2']} />,
    );

    expect(screen.getByText('tag-1')).toBeDefined();
    expect(screen.getByText('tag-2')).toBeDefined();
  });
});
