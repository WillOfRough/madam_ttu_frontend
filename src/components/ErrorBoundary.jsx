import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <h2 className={styles.title}>문제가 발생했습니다</h2>
            <p className={styles.message}>
              페이지를 표시하는 중 오류가 발생했습니다.
              <br />
              아래 버튼을 눌러 다시 시도해주세요.
            </p>
            <button className={styles.retryBtn} onClick={this.handleReset}>
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
