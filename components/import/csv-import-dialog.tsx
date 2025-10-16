"use client"

import { Fragment, ReactNode, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export type CsvImportRowError = {
  index: number
  errors: string[]
}

export type CsvImportFieldConfig<TField extends string> = {
  key: TField
  label: string
  description?: string
  required?: boolean
}

interface CsvImportDialogProps<TField extends string> {
  open: boolean
  onOpenChange: (open: boolean) => void
  headers: string[]
  rows: Record<string, string>[]
  fields: CsvImportFieldConfig<TField>[]
  mapping: Record<TField, string | null>
  onMappingChange: (key: TField, column: string | null) => void
  rowErrors: CsvImportRowError[]
  onSubmit: () => void
  onCancel: () => void
  isSubmitting: boolean
  disabledReason?: string | null
  templateDescription?: ReactNode
  parseError?: string | null
  previewLimit?: number
  title?: string
  description?: string
}

export function CsvImportDialog<TField extends string>({
  open,
  onOpenChange,
  headers,
  rows,
  fields,
  mapping,
  onMappingChange,
  rowErrors,
  onSubmit,
  onCancel,
  isSubmitting,
  disabledReason,
  templateDescription,
  parseError,
  previewLimit = 8,
  title = "Import data",
  description = "Review the parsed CSV data, map each column, and confirm the import.",
}: CsvImportDialogProps<TField>) {
  const rowErrorLookup = useMemo(() => {
    const map = new Map<number, string[]>()
    rowErrors.forEach((error) => {
      map.set(error.index, error.errors)
    })
    return map
  }, [rowErrors])

  const limitedRows = useMemo(() => rows.slice(0, previewLimit), [rows, previewLimit])

  const hasErrors = rowErrors.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {templateDescription ? (
            <Alert>
              <AlertTitle>CSV template</AlertTitle>
              <AlertDescription>{templateDescription}</AlertDescription>
            </Alert>
          ) : null}

          {parseError ? (
            <Alert className="border-destructive/60 bg-destructive/10 text-destructive">
              <AlertTitle>Could not read file</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="flex items-center gap-2">
                  {field.label}
                  {field.required ? (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Required
                    </Badge>
                  ) : null}
                </Label>
                <Select
                  value={mapping[field.key] ?? ""}
                  onValueChange={(value) =>
                    onMappingChange(field.key, value === "" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a CSV column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unmapped</SelectItem>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.description ? (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {limitedRows.length} of {rows.length} row{rows.length === 1 ? "" : "s"}
              </span>
              {hasErrors ? (
                <span className="text-destructive">
                  {rowErrors.length} row{rowErrors.length === 1 ? " has" : "s have"} validation errors
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">
                  No validation errors detected
                </span>
              )}
            </div>

            <ScrollArea className="max-h-80 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    {headers.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {limitedRows.map((row, index) => {
                    const globalIndex = index
                    const errors = rowErrorLookup.get(globalIndex)
                    return (
                      <TableRow
                        key={globalIndex}
                        className={errors ? "bg-destructive/5" : undefined}
                      >
                        <TableCell className="font-medium">{globalIndex + 1}</TableCell>
                        {headers.map((header) => (
                          <TableCell key={header}>{row[header] ?? ""}</TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                  {limitedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={headers.length + 1} className="text-center text-muted-foreground">
                        No data rows detected in this file.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </ScrollArea>

            {hasErrors ? (
              <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {rowErrors.map((rowError) => (
                  <Fragment key={rowError.index}>
                    <p className="font-medium">Row {rowError.index + 1}</p>
                    <ul className="ml-4 list-disc space-y-1">
                      {rowError.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </Fragment>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={Boolean(disabledReason) || isSubmitting}
          >
            {isSubmitting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
        {disabledReason ? (
          <p className="pt-2 text-sm text-destructive">{disabledReason}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

