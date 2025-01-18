import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  companyBackground: string;
  ceoName: string;
}

export function WelcomeDialog({
  isOpen,
  onClose,
  companyName,
  companyBackground,
  ceoName,
}: WelcomeDialogProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className='sm:max-w-[600px] bg-card border-border'>
        <DialogHeader className='space-y-4'>
          <DialogTitle className='text-3xl font-semibold text-primary'>
            Welcome to {companyName}
          </DialogTitle>
          <DialogDescription asChild>
            <div className='space-y-6 text-lg leading-relaxed'>
              <div className='p-4 rounded-lg bg-muted border-border'>{companyBackground}</div>
              <div className='p-4 rounded-lg bg-muted border-border'>
                As <span className='font-bold text-primary'>{ceoName}</span>, you&apos;ll face a
                challenging press conference. Your responses will impact the stock price - handle
                questions wisely!
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='mt-2'>
          <Button
            onClick={onClose}
            className='w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300'
          >
            I&apos;m Ready
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
