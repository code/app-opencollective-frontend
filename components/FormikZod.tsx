import React from 'react';
import { Formik } from 'formik';
import { get, set } from 'lodash';
import { IntlShape, useIntl } from 'react-intl';
import { z } from 'zod';

import { RICH_ERROR_MESSAGES } from '../lib/form-utils';

const getCustomZodErrorMap = intl => (error, ctx) => {
  if (error.message && error.message !== ctx.defaultError) {
    return { message: error.message }; // If a custom message was provided, use it
  }

  let message = error.message;
  if (error.code === 'too_big') {
    message = intl.formatMessage(RICH_ERROR_MESSAGES.maxLength, { count: error.maximum });
  } else if (error.code === 'too_small') {
    message = intl.formatMessage(RICH_ERROR_MESSAGES.minLength, { count: error.minimum });
  } else if (error.code === 'invalid_string') {
    message = intl.formatMessage(RICH_ERROR_MESSAGES.format);
  } else if (error.code === 'invalid_enum_value') {
    message = intl.formatMessage(RICH_ERROR_MESSAGES.enum, { options: error.options.join(', ') });
  }

  return { message: message || intl.formatMessage(RICH_ERROR_MESSAGES.invalidValue) };
};

/**
 * @returns A function that can be used as a Formik `validate` function for a Zod schema. The function will
 * check the values against the Zod schema and return an object of internationalized error messages.
 */
export const getErrorsObjectFromZodSchema = (
  intl: IntlShape,
  zodSchema: z.AnyZodObject | z.ZodEffects<z.AnyZodObject>,
  values,
) => {
  const errors = {};
  const result = zodSchema.safeParse(values, { errorMap: getCustomZodErrorMap(intl) });
  if (!result.success) {
    const errorResult = result as z.SafeParseError<typeof values>;
    for (const error of errorResult.error.issues) {
      if (!get(errors, error.path)) {
        set(errors, error.path, error.message);
      }
    }
  }

  return errors;
};

/**
 * A wrapper around `Formik` that plugs in Zod validation.
 *
 * Combined with `StyledInputFormikField` this components provides a simple way to have automatic
 * form validation and HTML best practices (e.g. setting the `required` and HTML validation attributes).
 */
export const FormikZod = ({
  schema,
  ...props
}: Omit<React.ComponentProps<typeof Formik>, 'initialStatus' | 'validate' | 'initialValues'> & {
  schema: z.AnyZodObject | z.ZodEffects<z.AnyZodObject>;
  initialValues: z.infer<typeof schema>;
}) => {
  const intl = useIntl();
  const validate = React.useCallback(values => getErrorsObjectFromZodSchema(intl, schema, values), [intl, schema]);
  return <Formik initialStatus={schema} validate={validate} {...props} />;
};
