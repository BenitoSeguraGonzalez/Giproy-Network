import com.aspose.tasks.Asn;
import com.aspose.tasks.Duration;
import com.aspose.tasks.License;
import com.aspose.tasks.Prj;
import com.aspose.tasks.Project;
import com.aspose.tasks.Resource;
import com.aspose.tasks.Rsc;
import com.aspose.tasks.SaveFileFormat;
import com.aspose.tasks.Task;
import com.aspose.tasks.TaskLinkType;
import com.aspose.tasks.Tsk;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class aspose_tasks_mpp_runner {
    private static final ZoneId ZONE_ID = ZoneId.systemDefault();
    private static final String FORCE_RECALCULATE_ENV = "GIPROY_MPP_FORCE_RECALCULATE";

    public static void main(String[] args) throws Exception {
        long startedAt = System.nanoTime();
        if (args.length < 4) {
            System.err.println("Usage: aspose_tasks_mpp_runner <licensePath> <templateMppPath> <xmlInputPath> <mppOutputPath>");
            System.exit(2);
        }

        String licensePath = args[0];
        String templateMppPath = args[1];
        String xmlInputPath = args[2];
        String mppOutputPath = args[3];

        License license = new License();
        license.setLicense(licensePath);
        logPhase("license_loaded", startedAt);

        Project project = new Project(templateMppPath);
        Document xml = loadDocument(xmlInputPath);
        logPhase("template_and_xml_loaded", startedAt);

        clearProject(project);
        applyProjectMetadata(project, xml);
        logPhase("project_cleared_and_metadata_applied", startedAt);

        Map<Integer, Task> tasksByUid = rebuildTasks(project, xml);
        Map<Integer, Resource> resourcesByUid = rebuildResources(project, xml);
        rebuildAssignments(project, xml, tasksByUid, resourcesByUid);
        rebuildDependencies(project, xml, tasksByUid);
        logPhase("project_rebuilt", startedAt);

        if (shouldForceRecalculate()) {
            project.recalculate();
            logPhase("project_recalculated", startedAt);
        }
        project.save(mppOutputPath, SaveFileFormat.MPP);
        logPhase("mpp_saved", startedAt);

        System.out.println(mppOutputPath);
    }

    private static boolean shouldForceRecalculate() {
        String value = System.getenv(FORCE_RECALCULATE_ENV);
        if (value == null) {
            return false;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.equals("1") || normalized.equals("true") || normalized.equals("yes");
    }

    private static void logPhase(String phase, long startedAt) {
        long elapsedMillis = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
        System.err.println("[giproy-mpp] " + phase + " elapsed_ms=" + elapsedMillis);
    }

    private static Document loadDocument(String xmlInputPath) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        Document document = factory.newDocumentBuilder().parse(new File(xmlInputPath));
        document.getDocumentElement().normalize();
        return document;
    }

    private static void clearProject(Project project) {
        project.getResourceAssignments().clear();
        project.getTaskLinks().clear();

        List<Resource> resources = project.getResources().toList();
        for (Resource resource : resources) {
            resource.delete();
        }

        List<Task> topLevelTasks = project.getRootTask().getChildren().toList();
        for (Task task : topLevelTasks) {
            task.delete();
        }
    }

    private static void applyProjectMetadata(Project project, Document xml) {
        Element root = xml.getDocumentElement();
        String projectName = childText(root, "Name", "GiProy Project");
        String projectTitle = childText(root, "Title", projectName);
        String startText = childText(root, "StartDate", null);
        String minutesPerDayText = childText(root, "MinutesPerDay", "480");
        String minutesPerWeekText = childText(root, "MinutesPerWeek", "2400");
        String daysPerMonthText = childText(root, "DaysPerMonth", "22");

        project.set(Prj.NAME, projectName);
        project.set(Prj.TITLE, projectTitle);
        project.set(Prj.MINUTES_PER_DAY, parseInteger(minutesPerDayText, 480));
        project.set(Prj.MINUTES_PER_WEEK, parseInteger(minutesPerWeekText, 2400));
        project.set(Prj.DAYS_PER_MONTH, parseInteger(daysPerMonthText, 22));
        if (startText != null && !startText.isEmpty()) {
            project.set(Prj.START_DATE, parseDate(startText));
        }
    }

    private static Map<Integer, Task> rebuildTasks(Project project, Document xml) {
        Map<Integer, Task> tasksByUid = new HashMap<>();
        Map<Integer, Task> parentByLevel = new HashMap<>();
        parentByLevel.put(0, project.getRootTask());

        Element tasksElement = firstChild(projectElement(xml), "Tasks");
        if (tasksElement == null) {
            return tasksByUid;
        }

        for (Element taskElement : childElements(tasksElement, "Task")) {
            int xmlUid = parseInteger(childText(taskElement, "UID", "-1"), -1);
            if (xmlUid <= 0) {
                continue;
            }

            int outlineLevel = Math.max(parseInteger(childText(taskElement, "OutlineLevel", "1"), 1), 1);
            Task parentTask = parentByLevel.getOrDefault(outlineLevel - 1, project.getRootTask());
            String taskName = childText(taskElement, "Name", "Task " + xmlUid);

            Task createdTask = parentTask.getChildren().add(taskName);
            parentByLevel.put(outlineLevel, createdTask);

            String startText = childText(taskElement, "Start", null);
            String finishText = childText(taskElement, "Finish", null);
            String durationText = childText(taskElement, "Duration", null);
            String notes = childText(taskElement, "Notes", null);
            String percentComplete = childText(taskElement, "PercentComplete", null);

            if (startText != null && !startText.isEmpty()) {
                createdTask.set(Tsk.START, parseDate(startText));
            }
            if (finishText != null && !finishText.isEmpty()) {
                createdTask.set(Tsk.FINISH, parseDate(finishText));
            } else if (durationText != null && !durationText.isEmpty()) {
                double hours = parseMspDurationHours(durationText);
                if (hours > 0) {
                    createdTask.set(Tsk.DURATION, Duration.parse(project, formatHoursDuration(hours)));
                }
            }
            if (notes != null && !notes.isEmpty()) {
                createdTask.set(Tsk.NOTES_TEXT, notes);
            }
            if (percentComplete != null && !percentComplete.isEmpty()) {
                createdTask.set(Tsk.PERCENT_COMPLETE, parseInteger(percentComplete, 0));
            }

            tasksByUid.put(xmlUid, createdTask);
        }

        return tasksByUid;
    }

    private static Map<Integer, Resource> rebuildResources(Project project, Document xml) {
        Map<Integer, Resource> resourcesByUid = new HashMap<>();
        Element resourcesElement = firstChild(projectElement(xml), "Resources");
        if (resourcesElement == null) {
            return resourcesByUid;
        }

        for (Element resourceElement : childElements(resourcesElement, "Resource")) {
            int xmlUid = parseInteger(childText(resourceElement, "UID", "-1"), -1);
            if (xmlUid <= 0) {
                continue;
            }

            String resourceName = childText(resourceElement, "Name", "Resource " + xmlUid);
            Resource resource = project.getResources().add(resourceName);

            resource.set(Rsc.NAME, resourceName);
            resource.set(Rsc.TYPE, parseInteger(childText(resourceElement, "Type", "0"), 0));

            String initials = childText(resourceElement, "Initials", null);
            if (initials != null && !initials.isEmpty()) {
                resource.set(Rsc.INITIALS, initials);
            }

            String group = childText(resourceElement, "Group", null);
            if (group != null && !group.isEmpty()) {
                resource.set(Rsc.GROUP, group);
            }

            String code = childText(resourceElement, "Code", null);
            if (code != null && !code.isEmpty()) {
                resource.set(Rsc.CODE, code);
            }

            String materialLabel = childText(resourceElement, "MaterialLabel", null);
            if (materialLabel != null && !materialLabel.isEmpty()) {
                resource.set(Rsc.MATERIAL_LABEL, materialLabel);
            }

            String standardRate = childText(resourceElement, "StandardRate", null);
            if (standardRate != null && !standardRate.isEmpty()) {
                resource.set(Rsc.STANDARD_RATE, new BigDecimal(standardRate.trim()));
            }

            resourcesByUid.put(xmlUid, resource);
        }

        return resourcesByUid;
    }

    private static void rebuildAssignments(Project project, Document xml, Map<Integer, Task> tasksByUid, Map<Integer, Resource> resourcesByUid) {
        Element assignmentsElement = firstChild(projectElement(xml), "Assignments");
        if (assignmentsElement == null) {
            return;
        }

        for (Element assignmentElement : childElements(assignmentsElement, "Assignment")) {
            int taskUid = parseInteger(childText(assignmentElement, "TaskUID", "-1"), -1);
            int resourceUid = parseInteger(childText(assignmentElement, "ResourceUID", "-1"), -1);
            Task task = tasksByUid.get(taskUid);
            Resource resource = resourcesByUid.get(resourceUid);
            if (task == null || resource == null) {
                continue;
            }

            double units = parseDouble(childText(assignmentElement, "Units", "1"), 1.0);
            com.aspose.tasks.ResourceAssignment assignment = project.getResourceAssignments().add(task, resource, units);

            String workText = childText(assignmentElement, "Work", null);
            if (workText != null && !workText.isEmpty()) {
                double workHours = parseMspDurationHours(workText);
                if (workHours > 0.0 && hasSchedulableTaskWindow(task)) {
                    assignment.set(Asn.WORK, Duration.parse(project, formatHoursDuration(workHours)));
                }
            }
        }
    }

    private static boolean hasSchedulableTaskWindow(Task task) {
        java.util.Date start = task.get(Tsk.START);
        java.util.Date finish = task.get(Tsk.FINISH);
        if (start == null || finish == null) {
            return false;
        }
        long deltaMillis = finish.getTime() - start.getTime();
        if (deltaMillis <= 0L) {
            return false;
        }
        long maxSpanMillis = TimeUnit.DAYS.toMillis(365L * 50L);
        return deltaMillis <= maxSpanMillis;
    }

    private static void rebuildDependencies(Project project, Document xml, Map<Integer, Task> tasksByUid) {
        Element tasksElement = firstChild(projectElement(xml), "Tasks");
        if (tasksElement == null) {
            return;
        }

        for (Element taskElement : childElements(tasksElement, "Task")) {
            int targetUid = parseInteger(childText(taskElement, "UID", "-1"), -1);
            Task targetTask = tasksByUid.get(targetUid);
            if (targetTask == null) {
                continue;
            }

            for (Element predecessorElement : childElements(taskElement, "PredecessorLink")) {
                int sourceUid = parseInteger(childText(predecessorElement, "PredecessorUID", "-1"), -1);
                Task sourceTask = tasksByUid.get(sourceUid);
                if (sourceTask == null) {
                    continue;
                }

                int type = parseDependencyType(childText(predecessorElement, "Type", "1"));
                String lagText = childText(predecessorElement, "LinkLag", "0");
                int lagTenthsMinutes = parseInteger(lagText, 0);
                if (lagTenthsMinutes == 0) {
                    project.getTaskLinks().add(sourceTask, targetTask, type);
                    continue;
                }

                double lagMinutes = lagTenthsMinutes / 10.0;
                Duration lagDuration = Duration.parse(project, formatHoursDuration(lagMinutes / 60.0));
                project.getTaskLinks().add(sourceTask, targetTask, type, lagDuration);
            }
        }
    }

    private static Element projectElement(Document xml) {
        return xml.getDocumentElement();
    }

    private static Element firstChild(Element parent, String localName) {
        if (parent == null) {
            return null;
        }
        NodeList children = parent.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child instanceof Element && localName.equals(child.getLocalName())) {
                return (Element) child;
            }
        }
        return null;
    }

    private static List<Element> childElements(Element parent, String localName) {
        java.util.ArrayList<Element> result = new java.util.ArrayList<>();
        if (parent == null) {
            return result;
        }
        NodeList children = parent.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child instanceof Element && localName.equals(child.getLocalName())) {
                result.add((Element) child);
            }
        }
        return result;
    }

    private static String childText(Element parent, String localName, String defaultValue) {
        Element child = firstChild(parent, localName);
        if (child == null) {
            return defaultValue;
        }
        String text = child.getTextContent();
        return text == null ? defaultValue : text.trim();
    }

    private static java.util.Date parseDate(String value) {
        String normalized = value.trim();
        try {
            return java.util.Date.from(OffsetDateTime.parse(normalized).toInstant());
        } catch (DateTimeParseException ignored) {
        }
        try {
            return java.util.Date.from(LocalDateTime.parse(normalized).atZone(ZONE_ID).toInstant());
        } catch (DateTimeParseException ignored) {
        }
        return java.util.Date.from(LocalDate.parse(normalized.substring(0, 10)).atStartOfDay(ZONE_ID).toInstant());
    }

    private static int parseInteger(String value, int defaultValue) {
        try {
            return Integer.parseInt(value.trim());
        } catch (Exception exc) {
            return defaultValue;
        }
    }

    private static double parseDouble(String value, double defaultValue) {
        try {
            return Double.parseDouble(value.trim());
        } catch (Exception exc) {
            return defaultValue;
        }
    }

    private static double parseMspDurationHours(String durationText) {
        String upper = durationText == null ? "" : durationText.trim().toUpperCase(Locale.ROOT);
        java.util.regex.Matcher match = java.util.regex.Pattern.compile(
            "P(?:(-?\\d+(?:\\.\\d+)?)D)?(?:T(?:(-?\\d+(?:\\.\\d+)?)H)?(?:(-?\\d+(?:\\.\\d+)?)M)?(?:(-?\\d+(?:\\.\\d+)?)S)?)?"
        ).matcher(upper);
        if (!match.matches()) {
            return 0.0;
        }
        double days = parseDouble(match.group(1), 0.0);
        double hours = parseDouble(match.group(2), 0.0);
        double minutes = parseDouble(match.group(3), 0.0);
        double seconds = parseDouble(match.group(4), 0.0);
        return (days * 24.0) + hours + (minutes / 60.0) + (seconds / 3600.0);
    }

    private static String formatHoursDuration(double hours) {
        double safeHours = Math.max(hours, 0.0);
        return String.format(Locale.US, "%.4fh", safeHours);
    }

    private static int parseDependencyType(String typeText) {
        String normalized = typeText == null ? "1" : typeText.trim();
        switch (normalized) {
            case "0":
                return TaskLinkType.FinishToFinish;
            case "2":
                return TaskLinkType.StartToStart;
            case "3":
                return TaskLinkType.StartToFinish;
            case "1":
            default:
                return TaskLinkType.FinishToStart;
        }
    }
}
