import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders with message', () => {
    const { getByText } = render(
      <ErrorMessage message="Something went wrong" />
    );

    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('renders error icon', () => {
    const { getByText } = render(
      <ErrorMessage message="Something went wrong" />
    );

    expect(getByText('❌')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <ErrorMessage message="Something went wrong" visible={false} />
    );

    expect(queryByText('Something went wrong')).toBeNull();
    expect(queryByText('❌')).toBeNull();
  });

  it('does not render when message is empty', () => {
    const { queryByText } = render(
      <ErrorMessage message="" />
    );

    expect(queryByText('❌')).toBeNull();
  });

  it('renders by default when visible prop is not provided', () => {
    const { getByText } = render(
      <ErrorMessage message="Something went wrong" />
    );

    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('handles long error messages', () => {
    const longMessage = 'This is a very long error message that should wrap properly and not overflow the container bounds';
    const { getByText } = render(
      <ErrorMessage message={longMessage} />
    );

    expect(getByText(longMessage)).toBeTruthy();
  });
});
