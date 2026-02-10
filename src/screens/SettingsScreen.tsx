import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { FormButton } from '@/components/FormButton';
import { colors } from '@/constants/colors';

interface SettingsScreenProps {
  navigation: any;
}

/**
 * SettingsScreen - User settings and family management
 *
 * Features:
 * - Account info (email display)
 * - Family management (name, invite code, switch/leave family)
 * - Baby list with add baby button
 * - Sign out functionality
 */
export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user, signOut } = useAuthStore();
  const { families, babies, currentFamilyId } = useFamilyStore();

  const currentFamily = families.find((f) => f.id === currentFamilyId);

  const handleCopyInviteCode = async () => {
    if (currentFamily?.invite_code) {
      await Clipboard.setStringAsync(currentFamily.invite_code);
      Alert.alert('Copied!', 'Invite code copied to clipboard');
    }
  };

  const handleAddBaby = () => {
    // Reuse onboarding add baby screen
    navigation.navigate('OnboardingAddBaby');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Email</Text>
              <Text style={styles.cardValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Family Section */}
        {currentFamily && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Family</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Family Name</Text>
                <Text style={styles.cardValue}>{currentFamily.name}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Invite Code</Text>
                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCode}>{currentFamily.invite_code}</Text>
                  <TouchableOpacity
                    onPress={handleCopyInviteCode}
                    style={styles.copyButton}
                    testID="copy-invite-code"
                  >
                    <Text style={styles.copyButtonText}>📋</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.hint}>
                Share this code with your partner to join your family
              </Text>
            </View>

            {families.length > 1 && (
              <TouchableOpacity style={styles.actionButton} testID="switch-family-button">
                <Text style={styles.actionButtonText}>Switch Family</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Babies Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Babies</Text>

          {babies.length > 0 ? (
            <View style={styles.card}>
              {babies.map((baby, index) => (
                <View key={baby.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.cardRow}>
                    <View>
                      <Text style={styles.babyName}>{baby.name}</Text>
                      <Text style={styles.babyInfo}>
                        Born {formatDate(baby.birthdate)}
                      </Text>
                      {baby.gender && (
                        <Text style={styles.babyInfo}>
                          {baby.gender.charAt(0).toUpperCase() + baby.gender.slice(1)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No babies added yet</Text>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddBaby}
            testID="add-baby-button"
          >
            <Text style={styles.actionButtonText}>+ Add New Baby</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Section */}
        <View style={styles.section}>
          <FormButton
            title="Sign Out"
            onPress={handleSignOut}
            variant="danger"
            testID="sign-out-button"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardRow: {
    paddingVertical: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteCode: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  copyButtonText: {
    fontSize: 24,
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  babyName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  babyInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  actionButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
