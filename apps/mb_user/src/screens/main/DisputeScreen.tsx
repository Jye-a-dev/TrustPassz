/**
 * TrustPassz Mobile - DisputeScreen
 * Dispute Initiation & Evidence Submission Screen with Client-Side 512x512 Keyframe Extraction.
 * Conforms to Cyber-Escrow theme, touch targets >= 44px, and Zero Memory Leak.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TrustPasszIcon } from '../../components/common/TrustPasszIcon';
import { KeyframePreviewGrid } from '../../components/dispute/KeyframePreviewGrid';
import { DisputeSuccessModal } from '../../components/dispute/DisputeSuccessModal';
import { VideoDropZone } from '../../components/dispute/VideoDropZone';
import { useCameraEvidence } from '../../hooks/useCameraEvidence';
import { apiClient } from '../../api/apiClient';

export interface DisputeScreenProps {
  initialDealId?: string;
  initiatorId?: string;
  onBack?: () => void;
  onDisputeCreated?: (disputeId: string) => void;
}

interface DisputeApiResponse {
  id?: string;
  disputeId?: string;
  dealId?: string;
  status?: string;
  message?: string;
}

export const DisputeScreen: React.FC<DisputeScreenProps> = ({
  initialDealId = '',
  initiatorId = '',
  onBack,
  onDisputeCreated,
}) => {
  const [dealId, setDealId] = useState<string>(initialDealId);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdDisputeId, setCreatedDisputeId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    keyframes,
    isExtracting,
    progress,
    error: extractionError,
    processVideoFile,
    resetEvidence,
    prepareFormData,
    hasEnoughKeyframes,
    totalSizeFormatted,
  } = useCameraEvidence();

  const handleSelectVideoFile = useCallback(
    async (file: File | Blob) => {
      setSubmitError(null);
      try {
        await processVideoFile(file);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Không thể giải mã video. Vui lòng thử lại với video khác.';
        Alert.alert('Lỗi xử lý video', msg);
      }
    },
    [processVideoFile],
  );

  const triggerVideoPicker = useCallback(() => {
    if (typeof document !== 'undefined') {
      if (!fileInputRef.current) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) {
            void handleSelectVideoFile(file);
          }
        };
        fileInputRef.current = input;
      }
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, [handleSelectVideoFile]);

  const handleSubmitDispute = async () => {
    if (!dealId.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng cung cấp mã Deal ký quỹ cần khiếu nại.');
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      Alert.alert(
        'Lý do quá ngắn',
        'Vui lòng giải thích chi tiết khiếu nại (tối thiểu 10 ký tự) để AI Arbitrator thẩm định.',
      );
      return;
    }

    if (!hasEnoughKeyframes) {
      Alert.alert(
        'Chưa đủ bằng chứng',
        'Vui lòng tải lên video bằng chứng. Cần đủ 3 khung hình (20%, 50%, 80%) để kích hoạt AI.',
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = prepareFormData(dealId, reason, initiatorId);
      const response = await apiClient.post<DisputeApiResponse>('/api/v1/disputes', formData);

      const generatedId =
        response?.id || response?.disputeId || `dsp_${Date.now().toString(36)}`;
      setCreatedDisputeId(generatedId);

      if (onDisputeCreated) {
        onDisputeCreated(generatedId);
      }
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Không thể gửi khiếu nại tới máy chủ. Vui lòng thử lại.';
      setSubmitError(errMsg);
      Alert.alert('Gửi khiếu nại thất bại', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = dealId.trim().length > 0 && reason.trim().length >= 10 && hasEnoughKeyframes;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Navigation / Header */}
        <View style={styles.navHeader}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
            >
              <Text style={styles.backButtonText}>← Quay lại</Text>
            </TouchableOpacity>
          )}
          <View style={styles.logoRow}>
            <TrustPasszIcon size={36} variant="glow" />
            <Text style={styles.screenHeading}>Trọng Tài AI & Khiếu Nại</Text>
          </View>
        </View>

        <Text style={styles.screenSubheading}>
          Ký quỹ Escrow bảo vệ quyền lợi 2 bên. Khi xảy ra bất đồng, AI Arbitrator sẽ phân tích 3
          khung hình đại diện để đưa ra phán quyết tự động.
        </Text>

        {/* Deal ID Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mã Deal Ký Quỹ (Deal ID)</Text>
          <TextInput
            style={styles.textInput}
            value={dealId}
            onChangeText={setDealId}
            placeholder="e.g. d0000000-0000-4000-a000-000000000001"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Reason Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Lý do khiếu nại chi tiết</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Mô tả cụ thể sai khác của tài sản hoặc sự cố phát sinh..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Video Picker Trigger Zone */}
        {keyframes.length === 0 && !isExtracting && (
          <VideoDropZone onTriggerPicker={triggerVideoPicker} />
        )}

        {/* Keyframe Preview Grid */}
        {(keyframes.length > 0 || isExtracting) && (
          <KeyframePreviewGrid
            keyframes={keyframes}
            isExtracting={isExtracting}
            progress={progress}
            error={extractionError}
            onReset={resetEvidence}
            onTriggerPicker={triggerVideoPicker}
          />
        )}

        {/* Error Feedback */}
        {submitError && (
          <View style={styles.submitErrorBanner}>
            <Text style={styles.submitErrorText}>⚠️ {submitError}</Text>
          </View>
        )}

        {/* Action Button: Submit Dispute */}
        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmitDispute}
          disabled={!isFormValid || isSubmitting}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Gửi khiếu nại & Kích hoạt AI"
        >
          {isSubmitting ? (
            <View style={styles.submittingRow}>
              <ActivityIndicator size="small" color="#0B0F17" />
              <Text style={styles.submitButtonText}>Đang nộp bằng chứng & khóa Deal...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              Gửi Khiếu Nại & Kích Hoạt AI Arbitrator {hasEnoughKeyframes ? '(3 Keyframes)' : ''}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <DisputeSuccessModal
        visible={createdDisputeId !== null}
        disputeId={createdDisputeId || ''}
        dealId={dealId}
        totalSizeFormatted={totalSizeFormatted}
        onClose={() => {
          setCreatedDisputeId(null);
          resetEvidence();
          if (onBack) onBack();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  navHeader: {
    marginBottom: 12,
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 13,
    color: '#06B6D4',
    fontWeight: '600',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  screenHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.2,
  },
  screenSubheading: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  textInput: {
    minHeight: 44,
    backgroundColor: '#0F172A',
    borderColor: '#27272A',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  textArea: {
    minHeight: 90,
  },
  submitErrorBanner: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: '#F43F5E',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  submitErrorText: {
    color: '#FECDD3',
    fontSize: 12,
  },
  submitButton: {
    minHeight: 48,
    backgroundColor: '#10B981',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B0F17',
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
