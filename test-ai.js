
import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = "AIzaSyBp-kQBzd0_oq41TuOzyFed_icnxcgRLwI";
async function runTest() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.models) {
        console.log("TOP 10 MODELS:");
        data.models.slice(0, 10).forEach(m => console.log(m.name));
    }
}
runTest();
