import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save } from 'lucide-react'
import { RawMaterial } from '@/lib/types'
import { MATERIAL_UNITS } from './types'

interface MaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingMaterial: RawMaterial | null
  materialForm: {
    name: string
    unit: string
    description: string
    minStock: string
  }
  setMaterialForm: (form: any | ((prev: any) => any)) => void
  saveMaterial: () => void
  saving: boolean
}

const MaterialDialog: React.FC<MaterialDialogProps> = ({
  open,
  onOpenChange,
  editingMaterial,
  materialForm,
  setMaterialForm,
  saveMaterial,
  saving,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingMaterial ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}</DialogTitle>
          <DialogDescription>
            {editingMaterial ? 'Cập nhật thông tin nguyên liệu' : 'Nhập thông tin nguyên liệu mới'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tên nguyên liệu</Label>
            <Input
              value={materialForm.name}
              onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">VD: Dây thừng, Vải canvas, Dây xích...</p>
          </div>
          <div>
            <Label>Đơn vị</Label>
            <Select value={materialForm.unit} onValueChange={(v) => setMaterialForm({ ...materialForm, unit: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea
              value={materialForm.description}
              onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">Mô tả thêm (không bắt buộc)</p>
          </div>
          <div>
            <Label>Mức cảnh báo (tồn kho tối thiểu)</Label>
            <Input
              type="number"
              value={materialForm.minStock}
              onChange={(e) => setMaterialForm({ ...materialForm, minStock: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">VD: 10</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={saveMaterial} disabled={saving || !materialForm.name} className="bg-forest hover:bg-forest-dark">
            {saving && <Save className="w-4 h-4 mr-1 animate-spin" />}
            {editingMaterial ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MaterialDialog
