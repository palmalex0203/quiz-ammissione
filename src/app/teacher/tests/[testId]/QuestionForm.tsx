"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ActionState } from "./actions";

type Option = { text: string; isCorrect: boolean };
type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE";

const initialState: ActionState = {};

const emptyMcOptions: Option[] = [
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
];

const trueFalseOptions: Option[] = [
  { text: "Vero", isCorrect: false },
  { text: "Falso", isCorrect: false },
];

export function QuestionForm({
  testId,
  action,
  initial,
  onDone,
  submitLabel,
}: {
  testId: string;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: { questionId?: string; subject: string; type: QuestionType; text: string; options: Option[] };
  onDone?: () => void;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [type, setType] = useState<QuestionType>(initial?.type ?? "MULTIPLE_CHOICE");
  const [text, setText] = useState(initial?.text ?? "");
  const [options, setOptions] = useState<Option[]>(
    initial?.options ?? (initial?.type === "TRUE_FALSE" ? trueFalseOptions : emptyMcOptions)
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      if (!initial) {
        setSubject("");
        setText("");
        setOptions(emptyMcOptions);
        setType("MULTIPLE_CHOICE");
        formRef.current?.reset();
      }
      onDone?.();
    }
    wasPending.current = isPending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, state]);

  function handleTypeChange(next: QuestionType) {
    setType(next);
    setOptions(next === "TRUE_FALSE" ? trueFalseOptions.map((o) => ({ ...o })) : emptyMcOptions.map((o) => ({ ...o })));
  }

  function setOptionText(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text: value } : o)));
  }

  function setCorrect(index: number) {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
  }

  function addOption() {
    setOptions((prev) => (prev.length >= 6 ? prev : [...prev, { text: "", isCorrect: false }]));
  }

  function removeOption(index: number) {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="testId" value={testId} />
      {initial?.questionId && <input type="hidden" name="questionId" value={initial.questionId} />}
      <input type="hidden" name="optionsJson" value={JSON.stringify(options)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Materia</label>
          <input
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="es. Biologia, Chimica, Logica..."
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Tipo</label>
          <select
            name="type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="MULTIPLE_CHOICE">Scelta multipla</option>
            <option value="TRUE_FALSE">Vero/Falso</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Testo della domanda</label>
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Opzioni (seleziona quella corretta)
        </label>
        {options.map((option, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correctOption"
              checked={option.isCorrect}
              onChange={() => setCorrect(i)}
              className="h-4 w-4"
            />
            <input
              type="text"
              value={option.text}
              onChange={(e) => setOptionText(i, e.target.value)}
              disabled={type === "TRUE_FALSE"}
              placeholder={`Opzione ${i + 1}`}
              required
              className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-500 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-800"
            />
            {type === "MULTIPLE_CHOICE" && options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
              >
                Rimuovi
              </button>
            )}
          </div>
        ))}
        {type === "MULTIPLE_CHOICE" && options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="self-start text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            + Aggiungi opzione
          </button>
        )}
      </div>

      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending ? "Salvataggio..." : submitLabel}
        </button>
        {onDone && initial && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Annulla
          </button>
        )}
      </div>
    </form>
  );
}
