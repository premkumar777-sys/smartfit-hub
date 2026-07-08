import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from 'recharts';

interface ICN_RadarChartProps {
    data: {
        Symmetry: number;
        Conditioning: number;
        Muscularity: number;
        Presence: number;
    };
}

export function ICN_RadarChart({ data }: ICN_RadarChartProps) {
    const chartData = [
        { subject: 'Symmetry', A: data.Symmetry, fullMark: 100 },
        { subject: 'Conditioning', A: data.Conditioning, fullMark: 100 },
        { subject: 'Muscularity', A: data.Muscularity, fullMark: 100 },
        { subject: 'Stage Presence', A: data.Presence, fullMark: 100 },
    ];

    return (
        <div className="w-full h-[300px] bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-gold/20 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#444" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#d4af37', fontSize: 12, fontWeight: 'bold' }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Athlete"
                        dataKey="A"
                        stroke="#d4af37"
                        fill="#d4af37"
                        fillOpacity={0.5}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
