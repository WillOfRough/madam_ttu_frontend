import useFormStore from '../../store/formStore';
import useAuthStore from '../../store/authStore';
import ProgressBar from '../../components/ProgressBar';
import StepTransition from '../../components/StepTransition';
import Step0Account from './Step0Account';
import Step1Intro from './Step1Intro';
import Step2Preference from './Step2Preference';
import StepComplete from './StepComplete';
import styles from './FormContainer.module.css';

const STEP_LABELS = {
  0: '계정 등록',
  1: '소중한 당신을 알고 싶어요',
  2: '당신이 꿈꾸는 인연',
  3: '완료',
};

export default function FormContainer() {
  const { currentStep } = useFormStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  // If already logged in, skip Step0 (account registration)
  const effectiveStep = currentStep === 0 && isLoggedIn ? 1 : currentStep;

  // For the progress bar, show 1/3 steps excluding step 0 and completion
  const progressStep = Math.max(0, effectiveStep);
  const pct = effectiveStep === 0
    ? 0
    : Math.round((Math.min(effectiveStep, 2) / 2) * 100);

  const renderStep = () => {
    switch (effectiveStep) {
      case 0:
        return <Step0Account />;
      case 1:
        return <Step1Intro />;
      case 2:
        return <Step2Preference />;
      case 3:
        return <StepComplete />;
      default:
        return <Step0Account />;
    }
  };

  return (
    <div className={styles.container}>
      {effectiveStep >= 1 && effectiveStep <= 2 && (
        <div className={styles.progressWrap}>
          <ProgressBar
            current={effectiveStep}
            total={2}
            label={STEP_LABELS[effectiveStep]}
            progressText={`마담MJ가 당신의 이야기를 경청하고 있어요 (${pct}% 완료)`}
          />
        </div>
      )}
      <StepTransition stepKey={effectiveStep}>
        {renderStep()}
      </StepTransition>
    </div>
  );
}
