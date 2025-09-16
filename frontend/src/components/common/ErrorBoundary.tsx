import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-container">
          <Result
            status="500"
            title="Что-то пошло не так"
            subTitle="Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу или вернуться на главную."
            extra={
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                >
                  Перезагрузить
                </Button>
                <Button 
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                >
                  На главную
                </Button>
              </div>
            }
          />
          {typeof window !== 'undefined' && (window as any).env?.NODE_ENV === 'development' && this.state.error && (
            <details 
              style={{ 
                margin: '2rem', 
                padding: '1rem', 
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            >
              <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                Детали ошибки (только в режиме разработки)
              </summary>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
