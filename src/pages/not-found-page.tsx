import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NotFoundPage() {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t('common:unknownRoute')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/68">{t('common:storageUnavailable')}</p>
        <Button onClick={() => navigate('/workspace', { replace: true })}>{t('common:backToWorkspace')}</Button>
      </CardContent>
    </Card>
  );
}
