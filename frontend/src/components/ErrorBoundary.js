import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { reportError } from '../observability/sentry';
import {
  PrimaryButton,
  Section,
} from './ui';
import { BrandMark } from './Brand';
import { useTheme } from '../theme';

function safeStringify(err) {
  try {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    return `${err.name || 'Error'}: ${err.message || ''}\n${err.stack || ''}`;
  } catch (e) {
    return 'Unknown error';
  }
}

function ThemedShell({ children }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

function FallbackTitle() {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[
        typography.title,
        { color: colors.ink, marginBottom: 12 },
      ]}
    >
      Something went off-script
    </Text>
  );
}

function FallbackBody() {
  const { colors, typography, spacing } = useTheme();
  return (
    <Text
      style={[
        typography.body,
        {
          color: colors.muted,
          marginBottom: spacing.xl,
        },
      ]}
    >
      The screen could not load. Your jobs and photos are still on this
      device — nothing was deleted. You can go back to the job list and try
      again.
    </Text>
  );
}

function FallbackDetails({ error }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <Section
      eyebrow="What happened"
      title="Details"
      tone="inset"
      style={styles.detailsSection}
    >
      <ScrollView style={styles.detailsScroll}>
        <Text
          style={[
            typography.mono,
            { color: colors.muted, lineHeight: 16, fontSize: 12 },
          ]}
        >
          {safeStringify(error)}
        </Text>
      </ScrollView>
    </Section>
  );
}

function ErrorFallback({ error, onRestart }) {
  const { spacing } = useTheme();
  return (
    <ThemedShell>
      <View
        style={[
          styles.inner,
          { paddingHorizontal: spacing.screen, paddingTop: spacing['3xl'] },
        ]}
      >
        <View style={styles.brand}>
          <BrandMark size={64} tone="accent" />
        </View>
        <FallbackTitle />
        <FallbackBody />
        <PrimaryButton
          label="Back to jobs"
          icon="refresh"
          onPress={onRestart}
        />
        <FallbackDetails error={error} />
      </View>
    </ThemedShell>
  );
}

/**
 * Global error boundary. Catches any render-phase error and shows a
 * calm, on-brand fallback screen. Does not lose the user's local
 * data; SQLite lives in the file system outside React's tree.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    reportError(error, { componentStack: info?.componentStack });
  }

  handleRestart = () => {
    this.setState({ error: null });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ErrorFallback
        error={this.state.error}
        onRestart={this.handleRestart}
      />
    );
  }
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  brand: {
    marginBottom: 24,
  },
  detailsSection: {
    marginTop: 24,
  },
  detailsScroll: {
    maxHeight: 200,
  },
});
