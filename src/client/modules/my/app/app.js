import { LightningElement, wire } from 'lwc';
// eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
import getAccountRecords from 'data/sfWire';
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
        typeAttributes: { rowActions: actions, menuAlignment: 'left' }
    }
];
export default class App extends LightningElement {
    result = {
        Id: 'a002w000003Mz7WAAS',
        Name: 'Naveen',
        SolarBot__r: {
            Id: 'a002w000003Mz7WAAS',
            Name: 'Kothuri',
            Account__r: {
                Id: 'a002w000003Mz7WAAS',
                Name: 'Naveen Kothuri'
            }
        }
    };
    columns = columns;
    editRecord;
    // eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
    @wire(getAccountRecords) getRecords({ data, error }) {
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
        console.log(this.editRecord);
    }
}
