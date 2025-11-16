'use client';

import { FieldType, StructField } from './formatters/FormattedIdl';
import { IdlDocTooltip } from './IdlDoc';

export function IdlFieldsView({ fieldType }: { fieldType: FieldType }) {
  switch (fieldType.kind) {
    case 'struct':
      return <IdlStructFieldsView fields={fieldType.fields} />;
    case 'enum':
      return <IdlEnumFieldsView variants={fieldType.variants} />;
    case 'type':
    case 'unknown':
      return <IdlTypeFieldView docs={fieldType.docs} name={fieldType.name} type={fieldType.type} />;
    default:
      return <></>;
  }
}

export function IdlStructFieldsView({ fields }: { fields?: StructField[] }) {
  if (!fields) return null;

  return (
    <div className="flex flex-col flex-wrap items-start justify-start gap-2">
      {fields.map((field, index) => (
        <IdlDocTooltip key={index} docs={field.docs}>
          <div className="inline-flex items-center gap-2">
            {field.name && <span>{field.name}:</span>}
            <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">{field.type}</span>
          </div>
        </IdlDocTooltip>
      ))}
    </div>
  );
}

export function IdlEnumFieldsView({ variants }: { variants?: string[] }) {
  if (!variants?.length) return null;

  return (
    <div className="flex flex-col flex-wrap items-start gap-2">
      {variants.map((variant, index) => (
        <span
          className="inline-flex items-center rounded-full bg-gray-500 px-2 py-0.5 text-xs font-medium text-white"
          key={index}
        >
          {variant}
        </span>
      ))}
    </div>
  );
}

export function IdlTypeFieldView({ docs, name, type }: { docs?: string[]; name?: string; type: string }) {
  return (
    <IdlDocTooltip docs={docs}>
      <div className="inline-flex items-center gap-2">
        {!!name && <span>{name}:</span>}
        <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">{type}</span>
      </div>
    </IdlDocTooltip>
  );
}
