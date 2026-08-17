<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {font-family:sans-serif; font-size:12px;}
        h1 {font-size:18px;}
        h2 {font-size:14px; margin-top:20px;}
        table {width:100%; border-collapse:collapse; margin-top:5px;}
        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
    </style>
</head>
<body>
    <h1>IT Help Desk Report</h1>
    <p>
        Range: {{ $report['range'] }} &nbsp;|&nbsp;
        {{ $report['start_date'] }} to {{ $report['end_date'] }}
    </p>
    <p>
        Total Tickets: {{ $report['total'] }} &nbsp;|&nbsp;
        Average Time to Resolve:
        {{ $report['average_resolution_hours'] !== null ? $report['average_resolution_hours'].' hours' : 'N/A' }}
    </p>

    <h2>Tickets by Status</h2>
    <table>
        @foreach($report['by_status'] as $label => $count)
            <tr><td>{{ $label }}</td><td>{{ $count }}</td></tr>
        @endforeach
    </table>

    <h2>Tickets by Category</h2>
    <table>
        @foreach($report['by_category'] as $label => $count)
            <tr><td>{{ $label }}</td><td>{{ $count }}</td></tr>
        @endforeach
    </table>

    <h2>Tickets by Priority</h2>
    <table>
        @foreach($report['by_priority'] as $label => $count)
            <tr><td>{{ $label }}</td><td>{{ $count }}</td></tr>
        @endforeach
    </table>
</body>
</html>