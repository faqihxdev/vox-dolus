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
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Welcome to {companyName}</DialogTitle>
          <DialogDescription className='pt-4 space-y-4'>
            <p>{companyBackground}</p>
            <p>
              As {ceoName}, you must navigate through a challenging press conference. Your responses
              will directly impact the company&apos;s stock price. Handle the reporters&apos;
              questions carefully!
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} className='w-full'>
            I&apos;m Ready
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
