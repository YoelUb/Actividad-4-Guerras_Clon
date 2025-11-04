import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders intro screen with title', () => {
  render(<App />);
  const titleElement = screen.getByText(/GUERRAS CLON/i);
  expect(titleElement).toBeInTheDocument();
});