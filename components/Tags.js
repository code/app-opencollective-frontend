import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';

import { expenseTagsQuery } from './dashboard/filters/ExpenseTagsFilter';
import { useToast } from './ui/useToast';
import EditTags, { AutocompleteEditTags } from './EditTags';
import { Flex } from './Grid';
import StyledTag from './StyledTag';

const setTagsMutation = gql`
  mutation SetTags($order: OrderReferenceInput, $expense: ExpenseReferenceInput, $tags: [String!]!) {
    setTags(expense: $expense, order: $order, tags: $tags) {
      order {
        id
        tags
      }
      expense {
        id
        tags
      }
    }
  }
`;

/**
 * Display expense tags, with the ability to edit them. Triggers a migration whenever a tag changes.
 */
const TagsForAdmins = ({ expense, order, suggestedTags }) => {
  const [setTags, { loading }] = useMutation(setTagsMutation, { context: API_V2_CONTEXT });
  const tagList = expense?.tags || order?.tags;
  const { toast } = useToast();
  const intl = useIntl();

  const onChange = React.useCallback(
    async tags => {
      try {
        const referencedObject = expense ? { expense: { id: expense.id } } : { order: { id: order.id } };
        await setTags({ variables: { ...referencedObject, tags: tags.map(tag => tag.value) } });
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
      }
    },
    [expense, order],
  );

  if (expense) {
    return (
      <AutocompleteEditTags
        disabled={loading}
        value={tagList}
        query={expenseTagsQuery}
        variables={{ account: { slug: expense?.account?.slug } }}
        onChange={onChange}
      />
    );
  }
  return <EditTags disabled={loading} value={tagList} suggestedTags={suggestedTags} onChange={onChange} />;
};

TagsForAdmins.propTypes = {
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  expense: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    legacyId: PropTypes.number,
    type: PropTypes.string,
    account: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }),
  order: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    legacyId: PropTypes.number,
    type: PropTypes.string,
  }),
};

const Tag = styled(StyledTag).attrs({
  mb: '4px',
  mr: '4px',
  variant: 'rounded',
})``;

const Tags = ({ expense, order, limit = 4, getTagProps, children, canEdit, suggestedTags, showUntagged }) => {
  const intl = useIntl();
  const tagList = expense?.tags || order?.tags;

  const renderTag = ({ tag, label }) => {
    const extraTagProps = getTagProps?.(tag) || {};

    const renderedTag = (
      <Tag key={tag} data-cy="expense-tag" {...extraTagProps}>
        {label ?? tag}
      </Tag>
    );

    return children ? children({ key: tag, tag, renderedTag, props: extraTagProps }) : renderedTag;
  };
  return (
    <Flex flexWrap="wrap" alignItems="flex-start">
      {canEdit ? (
        <TagsForAdmins expense={expense} order={order} suggestedTags={suggestedTags} />
      ) : (
        tagList && (
          <React.Fragment>
            {tagList.slice(0, limit).map(tag => renderTag({ tag }))}
            {showUntagged &&
              renderTag({
                tag: 'untagged',
                label: intl.formatMessage(defineMessage({ defaultMessage: 'Untagged', id: '8/OT+O' })),
              })}

            {tagList.length > limit && (
              <Tag color="black.600" title={tagList.slice(limit).join(', ')}>
                <FormattedMessage
                  id="expenses.countMore"
                  defaultMessage="+ {count} more"
                  values={{ count: tagList.length - limit }}
                />
              </Tag>
            )}
          </React.Fragment>
        )
      )}
    </Flex>
  );
};

Tags.propTypes = {
  /** Max number of tags to display */
  limit: PropTypes.number,
  /** A render func that gets passed the tag */
  children: PropTypes.func,
  /** A function to build the tag props dynamically */
  getTagProps: PropTypes.func,
  /** Whether current user can edit the tags */
  canEdit: PropTypes.bool,
  /** If canEdit is true, this array is used to display suggested tags */
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  expense: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    legacyId: PropTypes.number,
    type: PropTypes.string,
  }),
  order: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    legacyId: PropTypes.number,
    type: PropTypes.string,
  }),
  /** Whether to show an "Untagged" tag (when used for filtering) */
  showUntagged: PropTypes.bool,
};

export default Tags;
