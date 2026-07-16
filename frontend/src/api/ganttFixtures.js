export const ganttFixturesApi = {
    getFfFixture: async () => {
        const response = await fetch('/gantt-ff-fixture.json');
        return response.json();
    },
};

export default ganttFixturesApi;
