const db = require('../../services/db');
const weekTransition = require('../../services/weekTransition');
const scoreTriggers = require('../../services/score-triggers');
const utils  = require('../../services/utils')
const changes = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAC", "KC", "LAC", "LA", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];

const lineupArr = [
    { cardId: '223', txPath: 'owners/0x5cf24f62bcc2fafa056c8d1429bc799400e285ab/transactions', txId: 'systemLineup-97870eb0-4ebf-4106-90d0-4f495237d696' },
    { cardId: '251', txPath: 'owners/0x6d599962b71e028c17ebf9c9b83c2dcd32cf66b4/transactions', txId: 'systemLineup-de79f3ef-778f-4f2c-bc1e-1affa3e3b3d5' },
    { cardId: '252', txPath: 'owners/0xf8a3cbc156996f0fbde3c345eefe3fee4a9e5853/transactions', txId: 'OwnerLineup-83bdc9dd-372e-4f5d-a65f-7b0ed5abc24f' },
    { cardId: '255', txPath: 'owners/0x57cbe501092e36e87692d89ce4e75f98aa45feb2/transactions', txId: 'systemLineup-54e99cd5-6f40-4319-99b4-45d3326fcf44' },
    { cardId: '262', txPath: 'owners/0x80578bb41d7ee99aeb1cf79a8cd15fbe08fcc5a3/transactions', txId: 'OwnerLineup-93f42dd0-a660-4481-86ab-d4a73e917785' },
    { cardId: '270', txPath: 'owners/0xa2fd49d11af2a6d934e5e221d987f71180720aad/transactions', txId: 'systemLineup-44ca5f72-79a2-4b35-9de0-da9c70c0aa9f' },
    { cardId: '275', txPath: 'owners/0xa2fd49d11af2a6d934e5e221d987f71180720aad/transactions', txId: 'systemLineup-e8fd8324-d7f7-4282-9115-41803f01ce16' },
    { cardId: '277', txPath: 'owners/0x0621f9db527e567fa9a9d3f55ca3e53992b7dedb/transactions', txId: 'OwnerLineup-fa094cab-5780-4069-8259-ca91b8d77e59' },
    { cardId: '278', txPath: 'owners/0x9a6609b22172108a10675f8a754696ed177a4075/transactions', txId: 'OwnerLineup-289e53d3-d938-45fb-88ac-a424ed451fc4' },
    { cardId: '279', txPath: 'owners/0x0621f9db527e567fa9a9d3f55ca3e53992b7dedb/transactions', txId: 'OwnerLineup-e4510bf1-d84a-4636-81e7-45b31237d97b' },
    { cardId: '280', txPath: 'owners/0x394d013c64ff90a6db38609a200d1e38a2a08de2/transactions', txId: 'systemLineup-cc554495-f5dc-4047-9a1f-e1633ec06aaf' },
    { cardId: '281', txPath: 'owners/0x0621f9db527e567fa9a9d3f55ca3e53992b7dedb/transactions', txId: 'OwnerLineup-4d89ef38-0c27-4b3e-a12e-c59abac0681f' },
    { cardId: '282', txPath: 'owners/0x9a6609b22172108a10675f8a754696ed177a4075/transactions', txId: 'OwnerLineup-b825421d-59b4-4f92-b5f9-ec40414df38a' },
    { cardId: '283', txPath: 'owners/0x0621f9db527e567fa9a9d3f55ca3e53992b7dedb/transactions', txId: 'OwnerLineup-d1bb9633-ece1-410f-a2c6-7210fab21110' },
    { cardId: '284', txPath: 'owners/0x9a6609b22172108a10675f8a754696ed177a4075/transactions', txId: 'OwnerLineup-ecad8faf-34bd-427c-a92d-92cfe7acb88d' },
    { cardId: '285', txPath: 'owners/0x0621f9db527e567fa9a9d3f55ca3e53992b7dedb/transactions', txId: 'OwnerLineup-c42e1469-471a-4257-a286-fb777b3d277e' },
    { cardId: '288', txPath: 'owners/0x1a1f337faa595a3603b4a3e67776150e7883954d/transactions', txId: 'systemLineup-27620cf0-6390-4cd1-ab38-3d65058f1d0e' },
    { cardId: '289', txPath: 'owners/0x9a6609b22172108a10675f8a754696ed177a4075/transactions', txId: 'OwnerLineup-cf3a3efe-24f5-415a-a133-a6d16058d4f7' },
    { cardId: '290', txPath: 'owners/0x0621f9db527e567fa9a9d3f55ca3e53992b7dedb/transactions', txId: 'OwnerLineup-40a2b616-af76-4060-a2f3-178f897e2739' },
    { cardId: '291', txPath: 'owners/0x8468d4b698fe112f9aa1fa86278a21ea0997c3fe/transactions', txId: 'OwnerLineup-8e21c105-5dcb-4406-bcf7-2cb5a82fa959' }, 
    {
        cardId: '0',
        txId: 'systemLineup-a16ad65f-f090-48ed-89a7-aae4fbc9a764',
        txPath: 'owners/0x5df5e699dd79a32243df958082a5e39234589f3d/transactions/'  
    },
    {
        cardId: '200',
        txId: 'OwnerLineup-89b3fbfd-b33a-4376-8050-1781bf264b59',
        txPath: 'owners/0x80578bb41d7ee99aeb1cf79a8cd15fbe08fcc5a3/transactions/'  
    },
    {
        cardId: '201',
        txId: 'systemLineup-b99530af-e4d7-4d80-8bb6-804370c12c7a',
        txPath: 'owners/0xa792cfd711f0a03f9d138eb77ffb557f9d2f554c/transactions/'  
    },
    {
        cardId: '202',
        txId: 'OwnerLineup-44b1a505-7f09-4a3c-96d8-bc37edc8dfe4',
        txPath: 'owners/0x96569ea21fa33def8b06a1b901f72e9776d987a8/transactions/'  
    },
    {
        cardId: '203',
        txId: 'systemLineup-dcccddb6-9331-46b5-9ff8-adb947a70b3e',
        txPath: 'owners/0x8db88cb0658d072a5044d885c2fc8391b0d10a5c/transactions/'  
    },
    {
        cardId: '204',
        txId: 'systemLineup-9ef5a145-aee0-47f1-b4ba-ee5591707180',
        txPath: 'owners/0xe289548f6219f70e243d4cd26759a211a6468649/transactions/'  
    },
    {
        cardId: '205',
        txId: 'systemLineup-ace035e5-67f5-4c1a-a0cc-38e756d768e8',
        txPath: 'owners/0xe289548f6219f70e243d4cd26759a211a6468649/transactions/'  
    },
    {
        cardId: '207',
        txId: 'systemLineup-2d9286e7-2353-44bb-806f-dc158afb4c21',
        txPath: 'owners/0x35f8b2320b5016156065773498b5be999bc0be4b/transactions/'  
    },
    {
        cardId: '216',
        txId: 'OwnerLineup-9f599113-ced3-4341-93c4-96d330cdfedf',
        txPath: 'owners/0x3744829c73f6c99a23b57b2e90af232d4c86271e/transactions/'  
    },
    {
        cardId: '217',
        txId: 'OwnerLineup-2648fc8c-9b4e-47c1-b1ff-83106328c93e',
        txPath: 'owners/0x07006a4f8a5cdbc646a9c795f7b2c7b7dc1b702d/transactions/'  
    },
    {
        cardId: '221',
        txId: 'systemLineup-7b0087a0-8b78-491f-ab19-89cac70886ea',
        txPath: 'owners/0xd396a3382e348d06a89d1be7a87082bc2ce4d5d0/transactions/'  
    },
    {
        cardId: '222',
        txId: 'systemLineup-f4635d76-1718-4c37-9193-2b2942f2a1f7',
        txPath: 'owners/0x35f8b2320b5016156065773498b5be999bc0be4b/transactions/'  
    },
    {
        cardId: '223',
        txId: 'systemLineup-97870eb0-4ebf-4106-90d0-4f495237d696',
        txPath: 'owners/0x5cf24f62bcc2fafa056c8d1429bc799400e285ab/transactions/'  
    },
    {
        cardId: '229',
        txId: 'systemLineup-49b6cd7f-d5b5-41d9-947e-30b5912191aa',
        txPath: 'owners/0x207183b0d3d52dbc1179b81583d95905a051f43e/transactions/'  
    },
    {
        cardId: '83',
        txId: 'systemLineup-e161794a-d58b-47c9-9667-3e40befabdfc',
        txPath: 'owners/0x5072fd0e4c8e5c790a51ad79c36f37486b2fc189/transactions/'  
    },
    {
        cardId: '232',
        txId: 'OwnerLineup-070550bd-a771-49da-a935-42426d773546',
        txPath: 'owners/0x07fddfdf8f583b87e0b8ad3fb7adf3918e1ffdad/transactions/'  
    },
    {
        cardId: '286',
        txId: 'systemLineup-854daaf7-3a9a-4cd5-8a39-42a681706d64',
        txPath: 'owners/0x0a680b9bf0bfff583bcb6e23412db75b3b284504/transactions/'  
    },
    {
        cardId: '287',
        txId: 'OwnerLineup-da314f3f-a6ed-46a9-bc8f-4d3d729f9fa4',
        txPath: 'owners/0x9a6609b22172108a10675f8a754696ed177a4075/transactions/'  
    },
    {
        cardId: '299',
        txId: 'systemLineup-ed182f85-c2c7-4005-82dc-06dd716cc181',
        txPath: 'owners/0x1ec1aa49ea4f8079dcf1a924158369e119d5d7a1/transactions/'  
    }
];


// (async () => {
//     const gameweek = '2022-REG-15'
//     const prevWeek = '2022-REG-14'
//     const results = [];
//     // const lineupArr = [
//     //     { cardId: '3', txPath: 'owners/0x92f1c003bba80b08ed31949fbf3165ce6f5583ca/transactions', txId: 'OwnerLineup-2657cd2f-3a90-4e0f-9617-29c15c0e3938' },
//     //     { cardId: '174', txPath: 'owners/0x457cda89ca4119319d4c26679961d072a1d5be2e/transactions', txId: 'systemLineup-0ab48b84-c32e-46ba-a1b6-5c0a1a68f144' },
//     //     { cardId: '177', txPath: 'owners/0x3facfe8962b8065f40c3c1930e175188c5c0fc2a/transactions', txId: 'OwnerLineup-83a49afd-69d4-427a-88a7-fad39eed49ce' },
//     //     { cardId: '180', txPath: 'owners/0x093c7795ce5b55fa4eec76d054b482ba02553983/transactions', txId: 'systemLineup-775fdfce-2114-4f55-918d-74169044b877' },
//     //     { cardId: '182', txPath: 'owners/0xbafb5e8efd83d502ff39983b19e6257600ec78b8/transactions', txId: 'systemLineup-68b4ad27-ede4-4154-85bf-fd35a2ee8c93' },
//     //     { cardId: '183', txPath: 'owners/0xbafb5e8efd83d502ff39983b19e6257600ec78b8/transactions', txId: 'systemLineup-1f1ddbe9-bbff-40bd-818b-ae3e74f16af4' },
//     //     { cardId: '184', txPath: 'owners/0xbafb5e8efd83d502ff39983b19e6257600ec78b8/transactions', txId: 'systemLineup-91c0b1a0-d7c9-49c2-8cf7-bec9b0fc8b46' },
//     //     { cardId: '185', txPath: 'owners/0xbafb5e8efd83d502ff39983b19e6257600ec78b8/transactions', txId: 'systemLineup-420a7f8f-72f6-42f7-b144-ca27cfd88559' },
//     //     { cardId: '186', txPath: 'owners/0x0621f9db527e567fa9a9d3f55ca3e53992b7dedb/transactions', txId: 'OwnerLineup-fab0ef9f-e304-43ed-b55b-1c06c5be8791' }, 
//     //     { cardId: '187', txPath: 'owners/0xd6e4f9693c05d8af67a40f1ccbc16318f6a5c524/transactions', txId: 'systemLineup-39fdcefb-2110-4562-b9d2-6784557a5337' },
//     //     { cardId: '188', txPath: 'owners/0xff17e6c68dfda4d94b79b0a2ea5012c704d9f2bf/transactions', txId: 'systemLineup-28ec7aed-9635-4c5f-a587-5574d7b5ce82' },
//     //     { cardId: '190', txPath: 'owners/0x35f8b2320b5016156065773498b5be999bc0be4b/transactions', txId: 'systemLineup-6b058996-0d02-4e41-b447-e89b885cba57' },
//     //     { cardId: '191', txPath: 'owners/0x20335c504a4f0d8db934e9f77a67b55e6ae8e1e1/transactions', txId: 'systemLineup-72e851c6-1e69-4f4c-b95d-e9dc47f3a1e6' },
//     //     { cardId: '194', txPath: 'owners/0x63b3a1ca4117123e54824ffacf5bee6fcc27bdcc/transactions', txId: 'systemLineup-defa1771-166a-4047-a8a5-fd44a392d3c3' },
//     //     { cardId: '199', txPath: 'owners/0xbc867727babd596dbb4e59da26f7575608294ed9/transactions', txId: 'systemLineup-fb4bcec6-9108-416a-b2fa-c592154b006f' },
//     //     { cardId: '201', txPath: 'owners/0xa792cfd711f0a03f9d138eb77ffb557f9d2f554c/transactions', txId: 'systemLineup-b6bc1042-69f0-45e4-9994-7740a5bcfe87' },
//     //     { cardId: '202', txPath: 'owners/0x96569ea21fa33def8b06a1b901f72e9776d987a8/transactions', txId: 'OwnerLineup-da89116d-563a-4ae0-a950-6be5ef7aa0b2' },
//     //     { cardId: '203', txPath: 'owners/0x8db88cb0658d072a5044d885c2fc8391b0d10a5c/transactions', txId: 'OwnerLineup-68737903-9384-4b15-960a-d5858e459d9d' },
//     //     { cardId: '204', txPath: 'owners/0xe289548f6219f70e243d4cd26759a211a6468649/transactions', txId: 'systemLineup-884cbeab-7364-495b-a355-7e92c95306f8' },
//     //     { cardId: '205', txPath: 'owners/0xe289548f6219f70e243d4cd26759a211a6468649/transactions', txId: 'systemLineup-c44a8b99-f8c3-4b11-bbff-71c59860b2b4' },
//     //     { cardId: '206', txPath: 'owners/0x2478db4ff66440225a1e68f94ca9f5612e222cf7/transactions', txId: 'systemLineup-3716173d-d96e-4a8d-9343-ef12c415c027' },
//     //     { cardId: '207', txPath: 'owners/0x35f8b2320b5016156065773498b5be999bc0be4b/transactions', txId: 'systemLineup-2d9286e7-2353-44bb-806f-dc158afb4c21' },
//     //     { cardId: '208', txPath: 'owners/0xb93a2f5496c520c84bae3fa7abc246d43eb6ff6c/transactions', txId: 'OwnerLineup-e67f9b4f-9e40-4111-aab6-f0251d8ac587' },
//     //     { cardId: '209', txPath: 'owners/0xb93a2f5496c520c84bae3fa7abc246d43eb6ff6c/transactions', txId: 'OwnerLineup-09568f59-2f3f-4e5a-9121-be9c63b2f5dd' },
//     //     { cardId: '211', txPath: 'owners/0x07006a4f8a5cdbc646a9c795f7b2c7b7dc1b702d/transactions', txId: 'OwnerLineup-92b1a4b5-0741-446f-ad23-5562f9a38434' },
//     //     { cardId: '212', txPath: 'owners/0x28d26dd087be4b545c4d520336ff5c3767f51a02/transactions', txId: 'systemLineup-093ff8f4-a1e1-45af-a11a-e1792c9b1a65' },
//     //     { cardId: '215', txPath: 'owners/0x9c00f21cf43fd6966970673dcb104374d22dee83/transactions', txId: 'systemLineup-3b47386e-259a-4059-abf7-3936fa4632f6' },
//     //     { cardId: '220', txPath: 'owners/0x7acff18a20142e371bcf71267d8b8a6dadb0df99/transactions', txId: 'OwnerLineup-555996bd-2eaf-4d6e-a8f5-056141301801' },
//     //     { cardId: '221', txPath: 'owners/0xd396a3382e348d06a89d1be7a87082bc2ce4d5d0/transactions', txId: 'systemLineup-8c63e2ae-341d-430f-924b-9aea62f3e8f8' },
//     //     { cardId: '229', txPath: 'owners/0x207183b0d3d52dbc1179b81583d95905a051f43e/transactions', txId: 'systemLineup-faad4222-f910-46c8-b119-10792afb7af7' },
//     //     { cardId: '234', txPath: 'owners/0x07fddfdf8f583b87e0b8ad3fb7adf3918e1ffdad/transactions', txId: 'OwnerLineup-f150d4fa-2acb-4062-af00-1affe8398912' },
//     //     { cardId: '235', txPath: 'owners/0x07fddfdf8f583b87e0b8ad3fb7adf3918e1ffdad/transactions', txId: 'OwnerLineup-e09a56ff-6ca7-4037-bce8-c4d3b5f2a5f2' },
//     //     { cardId: '238', txPath: 'owners/0xe3e29998ef108ec5e01adccb76998e854d4a6386/transactions', txId: 'systemLineup-a76451c5-77ca-4b9e-9d7e-e5ae635e08f6' },
//     //     { cardId: '245', txPath: 'owners/0x57c7adf9ff221ea935a7d3749edf6a1f1d6f5383/transactions', txId: 'systemLineup-011cac14-b74e-4963-8217-8b7fb347e24b' },
//     //     { cardId: '253', txPath: 'owners/0x7cc561a947a6030abb46263b591ebf03a3717bf6/transactions', txId: 'systemLineup-37d5e7c3-5b1f-4989-a39e-8b0156e25f45' },
//     //     { cardId: '258', txPath: 'owners/0x04cfa8eef9549303f9ad99dd48f9fb46d15cc7b0/transactions', txId: 'systemLineup-94d5052f-0a9f-4ec7-b573-f945240c1282' },
//     //     { cardId: '260', txPath: 'owners/0x80578bb41d7ee99aeb1cf79a8cd15fbe08fcc5a3/transactions', txId: 'OwnerLineup-b9b6193c-71af-4e40-a9b4-c220a307780b' },
//     //     { cardId: '261', txPath: 'owners/0x80578bb41d7ee99aeb1cf79a8cd15fbe08fcc5a3/transactions', txId: 'OwnerLineup-262f6f4d-d261-468a-8c8d-876bc6f1fbbc' },
//     //     { cardId: '262', txPath: 'owners/0x80578bb41d7ee99aeb1cf79a8cd15fbe08fcc5a3/transactions', txId: 'systemLineup-6a8fc22b-0c97-4688-bee2-5f56ba2a1363' },
//     //     { cardId: '263', txPath: 'owners/0x94ccbc21601e4ebb4b2164d7b1f45df056c1ca91/transactions', txId: 'OwnerLineup-92fc8939-7ed7-4fe0-9955-be57b37c682e' },
//     //     { cardId: '264', txPath: 'owners/0xb6aa71e66f00babbd762c780891c03a1c8b063a3/transactions', txId: 'systemLineup-9e34236a-ef8c-4296-b12e-6dd802111fb7' },
//     //     { cardId: '265', txPath: 'owners/0xb6aa71e66f00babbd762c780891c03a1c8b063a3/transactions', txId: 'systemLineup-9a4a8291-6b57-40b9-8412-0c298f7cd538' },
//     //     { cardId: '266', txPath: 'owners/0xfb7a6e110cdb7015544fe735a0533eab315f4751/transactions', txId: 'OwnerLineup-c1481ad4-c822-4e6a-a0da-70378480dfe4' },
//     //     { cardId: '267', txPath: 'owners/0xd2767328596313bb6a1669e28679f261adac519d/transactions', txId: 'systemLineup-ad7c146c-d411-4040-8df4-96d5c46daf62' },
//     //     { cardId: '268', txPath: 'owners/0x4385a4f21f0318c0638d5d9ee90cbe297ef6ea70/transactions', txId: 'OwnerLineup-821046bf-2ad8-4ab8-9093-6020023461f4' },
//     //     { cardId: '269', txPath: 'owners/0x9c00f21cf43fd6966970673dcb104374d22dee83/transactions', txId: 'systemLineup-c9685958-4e51-4935-93f3-71aa18552984' },
//     //     { cardId: '270', txPath: 'owners/0xa2fd49d11af2a6d934e5e221d987f71180720aad/transactions', txId: 'systemLineup-6714a469-fbcb-4110-a691-0c498fb4940b' },
//     //     { cardId: '271', txPath: 'owners/0xa2fd49d11af2a6d934e5e221d987f71180720aad/transactions', txId: 'systemLineup-4bdefe97-b19c-4610-9ad0-32a2ff67483d' },
//     //     { cardId: '272', txPath: 'owners/0xa2fd49d11af2a6d934e5e221d987f71180720aad/transactions', txId: 'systemLineup-7332367d-1203-4290-bfb5-f371ef6b6c74' },
//     //     { cardId: '273', txPath: 'owners/0xa2fd49d11af2a6d934e5e221d987f71180720aad/transactions', txId: 'systemLineup-7a20e60d-6722-46c9-b391-5c804b7a3671' },
//     //     { cardId: '274', txPath: 'owners/0xa2fd49d11af2a6d934e5e221d987f71180720aad/transactions', txId: 'systemLineup-04a77f8d-456c-4f2e-a7e2-ded3272a5e1e' },
//     //     { cardId: '282', txPath: 'owners/0x9a6609b22172108a10675f8a754696ed177a4075/transactions', txId: 'OwnerLineup-49d80a5d-2dc0-4afb-80e2-5295db27833e' },
//     //     { cardId: '314', txPath: 'owners/0xc0f982492c323fcd314af56d6c1a35cc9b0fc31e/transactions', txId: 'systemLineup-ff267274-e28b-4917-a146-3e834f4ed99d' }
//     // ];
//     // const lineupArr = [
//     //     { cardId: '66', txPath: 'owners/0x283079c9f4bc32f0e88214efb5abd18b750b2b7b/transactions', txId: 'systemLineup-40568832-055e-4dc9-8ccb-7fab97d6d702' },
//     //     { cardId: '170', txPath: 'owners/0xef9b402a00286b2b951782c41586882534316758/transactions', txId: 'OwnerLineup-d52cdf2c-ce0a-4da6-b449-622de7719e4d' },
//     //     { cardId: '171', txPath: 'owners/0x9a6609b22172108a10675f8a754696ed177a4075/transactions', txId: 'OwnerLineup-2a979b53-1cd4-4958-a44b-93b819ab909f' }
//     // ]
//     // const lineupArr = [
//     //     { cardId: '0', txPath: 'owners/0x5df5e699dd79a32243df958082a5e39234589f3d/transactions', txId: 'systemLineup-45ee7676-8b67-4a8b-998f-0d5bfa2ea081' }
//     // ]
//     for(let i = 0; i < lineupArr.length; i++) {
//         const cardId = `${lineupArr[i].cardId}`;
//         const tx = await db.readDocument(lineupArr[i].txPath, lineupArr[i].txId);
//         const oldLineup = await db.readDocument(`leagues/genesis/cards/${lineupArr[i].cardId}/lineups`, prevWeek)
//         console.log(oldLineup)
//         const lineup = tx.newLineup;
//         lineup.prevWeekSeasonScore = oldLineup.scoreSeason;
//         lineup.scoreSeason = oldLineup.scoreSeason;
//         lineup.scoreWeek = 0;
//         lineup.gameWeek = '2022-REG-15';
//         console.log('prevWeekScore: ' + lineup.prevWeekSeasonScore);
//         console.log('scoreWeek: ' + lineup.scoreWeek);
//         console.log('season Score: ' + lineup.scoreSeason)
//         lineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(lineup);
//         if(cardId != lineup._cardId) {
//             console.log(`TRIED TO SET CARD ${cardId} TO THE WRONG CARD ID'S LINEUP`)
//             continue;
//         }
//         await db.createOrUpdateDocument(`leagues/genesis/cards/${lineupArr[i].cardId}/lineups`, gameweek, lineup, false)
//         console.log(`Updated lineup for card ${lineupArr[i].cardId}`)
//         await utils.sleep(500);
//         await scoreTriggers.lineupScoreMachine('genesis', cardId, gameweek, changes)
//         console.log('updated score for lineup')
//     }
//     console.log('COMPLETE')
// })();

( async () => {
    const gameweek = '2022-REG-17';
    const prevWeek = '2022-REG-16';
    const res = [];
    for(let i = 0; i < 10000; i++) {
        const lineupPath = `leagues/genesis/cards/${i}/lineups`;
        const cardId = `${i}`;
        console.log(cardId)
        const lineup = await db.readDocument(lineupPath, gameweek);
        if (cardId != lineup._cardId) {
            res.push(cardId)
        }
        if(!lineup.prevWeekSeasonScore) {
            res.push(cardId)
        }
        const prevLineup = await db.readDocument(lineupPath, prevWeek);
        if(prevLineup.scoreSeason != lineup.prevWeekSeasonScore) {
            res.push(cardId)
        }
    }
    console.log(res)
})()

// (async () => {
//     const gameweek = '2022-REG-15';
//     let results = [];
//     const weekStrings = utils.getStringsForCurrentWeek2022(gameweek)
//     console.log(weekStrings[1])
//     let leagueIds = await db.readAllDocumentIds('leagues');
//     leagueIds = leagueIds.filter(x => x.indexOf('Season') != -1 || x.indexOf('PROMO') != -1 || x.indexOf(weekStrings[1]) != -1);
//     for(let i = 0; i < leagueIds.length; i++) {
//         const leagueId = leagueIds[i];
//         console.log(leagueId)
//         const league = await db.readDocument('leagues', leagueId);
//         if(league.game.currentPlayers < league.game.minPlayers) {
//             console.log('did not reach min num of players');
//             continue;
//         }
//         const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
//         for(let j = 0; j < cardIds.length; j++) {
//             const cardId = cardIds[j];
//             const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
//             if(cardId != lineup._cardId) {
//                 results.push({ cardId: cardId, leagueId: leagueId })
//             }
//         }
//     }

//     if(results.length != 0) {
//         for(let i = 0; i < results.length; i++) {
//             console.log('card: ' + results[i].cardId);
//             console.log('leagueId: ' + results[i].leagueId);
//         }
//     }
// })()

// ( async () => {
//     const gameweek = '2022-REG-13';
//     const res = [];
//     for(let i = 0; i < 10000; i++) {
//         const lineupPath = `leagues/genesis/cards/${i}/lineups`;
//         const cardId = `${i}`;
//         console.log(cardId)
//         const lineup = await db.readDocument(lineupPath, gameweek);
//         if (!lineup.prevWeekSeasonScore || lineup.prevWeekSeasonScore == 0) {
//             res.push(cardId)
//         }
//     }
//     console.log(res)
// })()
