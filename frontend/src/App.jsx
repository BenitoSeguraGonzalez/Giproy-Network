import AppRouter from './routes/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { AppDialogProvider } from './components/ui/AppDialogProvider';

function App() {
  return (
    <AuthProvider>
      <AppDialogProvider>
        <AppRouter />
      </AppDialogProvider>
    </AuthProvider>
  );
}

export default App;
