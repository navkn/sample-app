import { LightningElement, wire } from 'lwc';
// eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
import { getDataFromSFWire, updateDataFromSFWire } from 'data/sfWire';
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' }
];
const columns = [
    { label: 'SolarBot Status Name', fieldName: 'Name' },
    { label: 'SolarBot Name', fieldName: 'SolarBotName' },
    { label: 'Account Name', fieldName: 'SolarBotAccountName' },
    {
        type: 'action',
        typeAttributes: { rowActions: actions, menuAlignment: 'right' }
    }
];
export default class App extends LightningElement {
    result;
    columns = columns;
    editRecord;
    recordsToUpdate = [];
    // eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
    @wire(getDataFromSFWire) getRecords({ data, error }) {
        console.log('Fetching the records');
        if (data) {
            console.log('got data', data);
            let records = data.records;
            records.forEach((rec) => {
                rec.SolarBotName = rec.SolarBot__r.Name;
                rec.SolarBotAccountName = rec.SolarBot__r.Account__r.Name;
            });
            this.result = records;
        }
        if (error) {
            console.log('got error', error);
        }
    }
    //error here
    @wire(updateDataFromSFWire, { records: '$recordsToUpdate' })
    updateRecords({ data, error }) {
        if (data) {
            console.log('Updated Data', data);
            this.recordsToUpdate = [];
        }
        if (error) {
            console.log('Error while updating data', error);
            this.recordsToUpdate = [];
        }
    }
    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        // eslint-disable-next-line default-case
        switch (action.name) {
            case 'edit':
                this.editRecord = row;
                break;
            case 'delete':
                // eslint-disable-next-line no-case-declarations
                const rows = this.result;
                // eslint-disable-next-line no-case-declarations
                const rowIndex = rows.indexOf(row);
                rows.splice(rowIndex, 1);
                this.data = rows;
                break;
        }
    }

    handleCancel() {
        this.editRecord = undefined;
    }
    handleSave() {
        this.recordsToUpdate.push(this.editRecord);
    }
}
