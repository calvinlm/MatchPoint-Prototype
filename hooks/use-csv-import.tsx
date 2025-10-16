"use client"

import { useCallback, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react"
import { toast } from "@/hooks/use-toast"
import {
  CsvImportDialog,
  CsvImportFieldConfig,
  CsvImportRowError,
} from "@/components/import/csv-import-dialog"

type RawCsvRow = Record<string, string>

interface TransformRowResult<TCleanRow> {
  data?: TCleanRow
  errors: string[]
}

export interface UseCsvImportOptions<TField extends string, TCleanRow> {
  contextKey: string
  fields: CsvImportFieldConfig<TField>[]
  transformRow: (args: {
    row: RawCsvRow
    index: number
    mapping: Record<TField, string | null>
    headers: string[]
  }) => TransformRowResult<TCleanRow>
  onSubmit: (rows: TCleanRow[]) => Promise<{ message?: string } | void>
  templateDescription?: ReactNode
  title?: string
  description?: string
}

interface UseCsvImportReturn<TField extends string> {
  triggerImport: () => void
  FileInput: JSX.Element
  ImportDialog: JSX.Element | null
  setDialogOpen: (open: boolean) => void
  mapping: Record<TField, string | null>
}

const ACCEPTED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "text/plain",
]

function parseCsv(text: string): { headers: string[]; rows: RawCsvRow[] } {
  const rows: string[][] = []
  let current = ""
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === "\"") {
        if (text[i + 1] === "\"") {
          current += "\""
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
      continue
    }

    if (char === "\"") {
      inQuotes = true
      continue
    }

    if (char === ",") {
      row.push(current)
      current = ""
      continue
    }

    if (char === "\n") {
      row.push(current)
      rows.push(row)
      row = []
      current = ""
      continue
    }

    if (char === "\r") {
      continue
    }

    current += char
  }

  row.push(current)
  rows.push(row)

  if (!rows.length) {
    return { headers: [], rows: [] }
  }

  const headerRow = rows[0].map((header, index) => {
    const trimmed = header.trim()
    return trimmed.length ? trimmed : `Column ${index + 1}`
  })

  const dataRows = rows
    .slice(1)
    .filter((fields) => fields.some((value) => (value ?? "").trim().length > 0))

  const records = dataRows.map((fields) => {
    return headerRow.reduce<RawCsvRow>((acc, header, index) => {
      acc[header] = (fields[index] ?? "").trim()
      return acc
    }, {})
  })

  return { headers: headerRow, rows: records }
}

export function useCsvImport<TField extends string, TCleanRow>({
  contextKey,
  fields,
  transformRow,
  onSubmit,
  templateDescription,
  title,
  description,
}: UseCsvImportOptions<TField, TCleanRow>): UseCsvImportReturn<TField> {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const storageKey = `csv-import:${contextKey}`

  const [dialogOpen, setDialogOpen] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<RawCsvRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createEmptyMapping = useCallback(() => {
    return Object.fromEntries(fields.map((field) => [field.key, null])) as Record<
      TField,
      string | null
    >
  }, [fields])

  const [mapping, setMapping] = useState<Record<TField, string | null>>(
    createEmptyMapping
  )

  const resetState = useCallback(() => {
    setDialogOpen(false)
    setHeaders([])
    setRows([])
    setParseError(null)
    setIsSubmitting(false)
    setMapping(createEmptyMapping())
  }, [createEmptyMapping])

  const autoDetectMapping = useCallback(
    (incomingHeaders: string[]) => {
      const saved =
        typeof window !== "undefined"
          ? window.localStorage.getItem(storageKey)
          : null
      let savedMapping: Record<TField, string | null> | null = null
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Record<TField, string | null>
          savedMapping = { ...parsed }
        } catch (error) {
          console.warn("Failed to parse saved CSV mapping", error)
        }
      }

      const normalizedHeaders = incomingHeaders.map((header) => header.toLowerCase())

      return fields.reduce((acc, field) => {
        const fromSaved = savedMapping?.[field.key]
        if (fromSaved && incomingHeaders.includes(fromSaved)) {
          acc[field.key] = fromSaved
          return acc
        }

        const target = field.label.toLowerCase()
        const matchIndex = normalizedHeaders.findIndex((header) =>
          header === target || header.replace(/[^a-z0-9]/gi, "").includes(target.replace(/[^a-z0-9]/gi, ""))
        )
        acc[field.key] = matchIndex >= 0 ? incomingHeaders[matchIndex] : null
        return acc
      }, createEmptyMapping())
    },
    [createEmptyMapping, fields, storageKey]
  )

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const mimeType = file.type
      if (mimeType && !ACCEPTED_MIME_TYPES.includes(mimeType)) {
        toast({
          variant: "destructive",
          title: "Unsupported file type",
          description: "Please upload a .csv file exported with column headers.",
        })
        event.target.value = ""
        return
      }

      try {
        const text = await file.text()
        const { headers: parsedHeaders, rows: parsedRows } = parseCsv(text)

        if (!parsedHeaders.length) {
          setParseError(
            "No header row detected. Please include a header row with column names."
          )
          setDialogOpen(true)
          setHeaders([])
          setRows([])
          return
        }

        if (!parsedRows.length) {
          setParseError("The uploaded file does not contain any data rows.")
          setDialogOpen(true)
          setHeaders(parsedHeaders)
          setRows([])
          setMapping(autoDetectMapping(parsedHeaders))
          return
        }

        setParseError(null)
        setHeaders(parsedHeaders)
        setRows(parsedRows)
        setMapping(autoDetectMapping(parsedHeaders))
        setDialogOpen(true)
      } catch (error: any) {
        console.error("CSV parse error", error)
        setParseError(error?.message || "Unable to read the selected file.")
        setHeaders([])
        setRows([])
        setDialogOpen(true)
      }

      event.target.value = ""
    },
    [autoDetectMapping]
  )

  const rowValidation = useMemo(() => {
    if (!rows.length) {
      return { cleanRows: [] as TCleanRow[], errors: [] as CsvImportRowError[] }
    }

    const errors: CsvImportRowError[] = []
    const cleanRows: TCleanRow[] = []

    rows.forEach((row, index) => {
      const { data, errors: rowErrors } = transformRow({
        row,
        index,
        mapping,
        headers,
      })

      if (rowErrors.length) {
        errors.push({ index, errors: rowErrors })
      }

      if (!rowErrors.length && data) {
        cleanRows.push(data)
      }
    })

    return { cleanRows, errors }
  }, [headers, mapping, rows, transformRow])

  const missingRequiredField = useMemo(() => {
    const missing = fields
      .filter((field) => field.required && !mapping[field.key])
      .map((field) => field.label)
    return missing.length
      ? `Map required field${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`
      : null
  }, [fields, mapping])

  const disabledReason = useMemo(() => {
    if (missingRequiredField) return missingRequiredField
    if (rowValidation.errors.length) {
      return "Resolve validation errors before importing."
    }
    if (!rows.length) {
      return "Upload a CSV file to continue."
    }
    if (rowValidation.cleanRows.length === 0) {
      return "No valid rows detected to import."
    }
    return null
  }, [missingRequiredField, rowValidation, rows.length])

  const handleSubmit = useCallback(async () => {
    if (disabledReason) return

    setIsSubmitting(true)
    try {
      const result = await onSubmit(rowValidation.cleanRows)
      const message = result?.message ?? `${rowValidation.cleanRows.length} row${rowValidation.cleanRows.length === 1 ? "" : "s"} imported successfully.`
      toast({
        title: "Import complete",
        description: message,
      })
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, JSON.stringify(mapping))
      }
      resetState()
    } catch (error: any) {
      console.error("Import submit failed", error)
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error?.message || "The server rejected the uploaded data.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [disabledReason, mapping, onSubmit, resetState, rowValidation, storageKey])

  const handleCancel = useCallback(() => {
    resetState()
  }, [resetState])

  const handleDialogChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetState()
      } else {
        setDialogOpen(true)
      }
    },
    [resetState]
  )

  const updateMapping = useCallback(
    (key: TField, column: string | null) => {
      setMapping((prev) => {
        const next = { ...prev, [key]: column }
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, JSON.stringify(next))
        }
        return next
      })
    },
    [storageKey]
  )

  const FileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".csv,text/csv"
      className="hidden"
      onChange={handleFileChange}
    />
  )

  const ImportDialog = dialogOpen ? (
    <CsvImportDialog
      open={dialogOpen}
      onOpenChange={handleDialogChange}
      headers={headers}
      rows={rows}
      fields={fields}
      mapping={mapping}
      onMappingChange={updateMapping}
      rowErrors={rowValidation.errors}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      disabledReason={disabledReason}
      templateDescription={templateDescription}
      parseError={parseError}
      title={title}
      description={description}
    />
  ) : null

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    triggerImport,
    FileInput,
    ImportDialog,
    setDialogOpen: setDialogOpen,
    mapping,
  }
}

