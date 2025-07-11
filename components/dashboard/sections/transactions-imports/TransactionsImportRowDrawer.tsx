import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { ComponentProps } from 'react';
import { FormattedMessage } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import type { TransactionsImportQuery } from '../../../../lib/graphql/types/v2/graphql';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';

import DateTime from '../../../DateTime';
import DrawerHeader from '../../../DrawerHeader';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import StyledLink from '../../../StyledLink';
import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '../../../ui/DataList';
import { Sheet, SheetBody, SheetContent } from '../../../ui/Sheet';

import { ImportedTransactionDataList } from './ImportedTransactionDataList';
import { TransactionsImportRowNoteForm } from './TransactionsImportRowNoteForm';
import { TransactionsImportRowStatusBadge } from './TransactionsImportRowStatusBadge';

export const TransactionsImportRowDrawer = ({
  getActions,
  row,
  rowIndex,
  autoFocusNoteForm,
  ...props
}: {
  row: TransactionsImportQuery['transactionsImport']['rows']['nodes'][number];
  getActions: GetActions<TransactionsImportQuery['transactionsImport']['rows']['nodes'][number]>;
  rowIndex: number;
  autoFocusNoteForm: boolean;
} & ComponentProps<typeof Sheet>) => {
  const dropdownTriggerRef = React.useRef(undefined);
  const [hasRawValuesExpanded, setHasRawValuesExpanded] = React.useState(false);
  return (
    <Sheet {...props}>
      <SheetContent>
        {row && (
          <React.Fragment>
            <DrawerHeader
              actions={getActions(row, dropdownTriggerRef)}
              entityName={<FormattedMessage defaultMessage="Transaction import row" id="qqPBY/" />}
              forceMoreActions
              entityLabel={
                <div className="text-2xl">
                  <span className={'font-bold text-foreground'}>
                    <FormattedMoneyAmount
                      amount={row.amount.valueInCents}
                      currency={row.amount.currency}
                      precision={2}
                      showCurrencyCode={false}
                    />
                  </span>
                  &nbsp;
                  <span className="text-muted-foreground">{row.amount.currency}</span>
                </div>
              }
              dropdownTriggerRef={dropdownTriggerRef}
              entityIdentifier={
                <FormattedMessage defaultMessage="No. {number}" id="rowNumber" values={{ number: rowIndex + 1 }} />
              }
            />
            <SheetBody className="break-all">
              <DataList>
                <DataListItem>
                  <DataListItemLabel>
                    <FormattedMessage id="Fields.status" defaultMessage="Status" />
                  </DataListItemLabel>
                  <DataListItemValue>
                    <TransactionsImportRowStatusBadge row={row} />
                  </DataListItemValue>
                </DataListItem>
                <DataListItem>
                  <DataListItemLabel>
                    <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                  </DataListItemLabel>
                  <DataListItemValue>
                    <DateTime dateStyle="medium" timeStyle="short" value={row.date} />
                  </DataListItemValue>
                </DataListItem>
                <DataListItem>
                  <DataListItemLabel>
                    <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
                  </DataListItemLabel>
                  <DataListItemValue>
                    <FormattedMoneyAmount amount={row.amount.valueInCents} currency={row.amount.currency} />
                  </DataListItemValue>
                </DataListItem>
                <DataListItem>
                  <DataListItemLabel>
                    <FormattedMessage id="Fields.description" defaultMessage="Description" />
                  </DataListItemLabel>
                  <DataListItemValue>{row.description}</DataListItemValue>
                </DataListItem>
                <DataListItem>
                  <DataListItemLabel>
                    <FormattedMessage id="AddFundsModal.source" defaultMessage="Source" />
                  </DataListItemLabel>
                  <DataListItemValue>{row.transactionsImport.source}</DataListItemValue>
                </DataListItem>
                <DataListItem>
                  <DataListItemLabel>
                    <FormattedMessage defaultMessage="Transaction ID" id="oK0S4l" />
                  </DataListItemLabel>
                  <DataListItemValue>{row.sourceId}</DataListItemValue>
                </DataListItem>
                <Collapsible open={hasRawValuesExpanded}>
                  <DataListItem>
                    <DataListItemLabel>
                      <FormattedMessage defaultMessage="Raw values" id="gWz5pY" />
                    </DataListItemLabel>
                    <DataListItemValue>
                      <CollapsibleTrigger
                        className="text-sm font-bold text-neutral-600"
                        onClick={() => setHasRawValuesExpanded(!hasRawValuesExpanded)}
                      >
                        {!hasRawValuesExpanded ? (
                          <React.Fragment>
                            <FormattedMessage defaultMessage="See all" id="seeRawValues" />
                            <Eye size={16} className="ml-2 inline-block" />
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <FormattedMessage defaultMessage="Hide" id="Hide" />
                            <EyeOff size={16} className="ml-2 inline-block" />
                          </React.Fragment>
                        )}
                      </CollapsibleTrigger>
                    </DataListItemValue>
                  </DataListItem>
                  <DataListItem>
                    <CollapsibleContent className="mt-2 text-sm">
                      <ImportedTransactionDataList row={row} transactionsImport={row.transactionsImport} hideBasics />
                    </CollapsibleContent>
                  </DataListItem>
                </Collapsible>
                {row.expense && (
                  <DataListItem>
                    <DataListItemLabel>
                      <FormattedMessage id="TransactionImportRow.LinkedTo" defaultMessage="Linked to" />
                    </DataListItemLabel>
                    <DataListItemValue>
                      <StyledLink href={`/${row.expense.account.slug}/expenses/${row.expense.legacyId}`}>
                        <FormattedMessage
                          defaultMessage="Expense #{id}"
                          id="E9pJQz"
                          values={{ id: row.expense.legacyId }}
                        />
                      </StyledLink>
                    </DataListItemValue>
                  </DataListItem>
                )}
                {row.order && (
                  <DataListItem>
                    <DataListItemLabel>
                      <FormattedMessage id="TransactionImportRow.LinkedTo" defaultMessage="Linked to" />
                    </DataListItemLabel>
                    <DataListItemValue>
                      <StyledLink href={`/${row.order.toAccount.slug}/contributions/${row.order.legacyId}`}>
                        <FormattedMessage
                          defaultMessage="Contribution #{id}"
                          id="Siv4wU"
                          values={{ id: row.order.legacyId }}
                        />
                      </StyledLink>
                    </DataListItemValue>
                  </DataListItem>
                )}
              </DataList>
              <hr className="my-4 border-gray-200" />
              <TransactionsImportRowNoteForm row={row} autoFocus={autoFocusNoteForm} />
            </SheetBody>
          </React.Fragment>
        )}
      </SheetContent>
    </Sheet>
  );
};
