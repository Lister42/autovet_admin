import { api } from "@/utils/api";

const TestDump = () => {

    const mutation = api.intravet.pushToFirebase.useMutation();

    function pushData() {
        try {
            
            const commit = true;
            mutation.mutate( {commit} );
            console.log("Commit: ", commit);

        } catch (e) {
            console.log("Error: ", e);
        }
    }

    return (
        <div className="grid place-items-center h-screen">
            <div className="border border-gray-900 btn" onClick={pushData}>
                <h1>{`Click me to Dump ;)`}</h1>
            </div>
            {mutation.error && <p> Error: {mutation.error.message}</p>}
        </div>
    )
}

export default TestDump;