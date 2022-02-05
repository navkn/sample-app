export const getDataFromSF = async () => {
    const options = {
        method: 'GET',
        mode: 'no-cors',
        headers: { Accept: 'application/json' }
    };
    const resp = await fetch(
        `https://intelligent-cloud-app.herokuapp.com/read`,
        options
    );
    var result = await resp.json();
    console.log(result);
    return result;
};

export const updateDataIntoSF = async (records) => {
    let data = {
        records: records,
        sObjectType: 'SolarBot_Status__c'
    };
    const params = data;
    const options = {
        method: 'POST',
        body: JSON.stringify(params),
        mode: 'no-cors',
        headers: { Accept: 'application/json' }
    };
    const resp = await fetch(
        `https://intelligent-cloud-app.herokuapp.com/update`,
        options
    );
    var result = await resp.json();
    console.log(result);
    return result;
};
