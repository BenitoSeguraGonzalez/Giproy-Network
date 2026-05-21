import { useContext } from 'react';
import { AppDialogContext } from '../components/ui/AppDialogProvider';

export function useAppDialog() {
    return useContext(AppDialogContext);
}
