import useFormStore from '../../store/formStore';
import ProgressBar from '../../components/ProgressBar';
import StepTransition from '../../components/StepTransition';
import Step1Intro from './Step1Intro';
import Step2Preference from './Step2Preference';
import StepComplete from './StepComplete';
import styles from './FormContainer.module.css';

const STEP_LABELS = {
  1: '소중한 당신을 알고 싶어요',
  2: '당신이 꿈꾸는 인연',
  3: '완료',
};

export default function FormContainer() {
  const { currentStep } = useFormStore();
  const pct = Math.round((currentStep / 2) * 100);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Intro />;
      case 2:
        return <Step2Preference />;
      case 3:
        return <StepComplete />;
      default:
        return <Step1Intro />;
    }
  };

  return (
    <div className={styles.container}>
      {currentStep <= 2 && (
        <div className={styles.progressWrap}>
          <ProgressBar
            current={currentStep}
            total={2}
            label={STEP_LABELS[currentStep]}
            progressText={`마담MJ가 당신의 이야기를 경청하고 있어요 (${pct}% 완료)`}
          />
        </div>
      )}
      <StepTransition stepKey={currentStep}>
        {renderStep()}
      </StepTransition>
    </div>
  );
}
