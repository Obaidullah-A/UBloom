import React from 'react';
import { render, screen } from '@testing-library/react';
import UBloomApp from './UBloomApp';

test('renders learn react link', () => {
  render(<UBloomApp />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
