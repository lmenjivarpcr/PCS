import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="flex justify-end gap-3">
        <Button variant="outline" autoFocus onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Confirmar
        </Button>
      </div>
    </Dialog>
  );
}
