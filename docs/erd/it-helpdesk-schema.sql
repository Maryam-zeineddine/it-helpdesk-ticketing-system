CREATE TABLE IF NOT EXISTS `mydb`.`Users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE)
ENGINE = InnoDB

CREATE TABLE IF NOT EXISTS `mydb`.`Tickets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `referenceNo` VARCHAR(45) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `assignedTo` INT NULL,
  `priorityId` INT NOT NULL,
  `statusId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` VARCHAR(45) NULL,
  `employeeId` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `referenceNo_UNIQUE` (`referenceNo` ASC) VISIBLE,
  INDEX `ticketsEmployee_idx` (`employeeId` ASC) VISIBLE,
  INDEX `ticketsAassigned_idx` (`assignedTo` ASC) VISIBLE,
  CONSTRAINT `ticketsEmployee`
    FOREIGN KEY (`employeeId`)
    REFERENCES `mydb`.`Users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `ticketsAassigned`
    FOREIGN KEY (`assignedTo`)
    REFERENCES `mydb`.`Users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB

CREATE TABLE IF NOT EXISTS `mydb`.`ActivityLogs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `targetType` VARCHAR(50) NOT NULL,
  `targetId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `LogsUser_idx` (`userId` ASC) VISIBLE,
  CONSTRAINT `LogsUser`
    FOREIGN KEY (`userId`)
    REFERENCES `mydb`.`Users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB

CREATE TABLE IF NOT EXISTS `mydb`.`TicketAttachements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ticketId` INT NOT NULL,
  `filePath` VARCHAR(255) NOT NULL,
  `fileType` VARCHAR(50) NOT NULL,
  `filesize` BIGINT NOT NULL,
  `uploadedBy` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `attachementTicket_idx` (`ticketId` ASC) VISIBLE,
  INDEX `attachementUpload_idx` (`uploadedBy` ASC) VISIBLE,
  CONSTRAINT `attachementTicket`
    FOREIGN KEY (`ticketId`)
    REFERENCES `mydb`.`Tickets` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `attachementUpload`
    FOREIGN KEY (`uploadedBy`)
    REFERENCES `mydb`.`Users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB

CREATE TABLE IF NOT EXISTS `mydb`.`TicketComments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ticketId` INT NOT NULL,
  `userId` INT NOT NULL,
  `comment` TEXT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `commentsTicket_idx` (`ticketId` ASC) VISIBLE,
  INDEX `commentsUser_idx` (`userId` ASC) VISIBLE,
  CONSTRAINT `commentsTicket`
    FOREIGN KEY (`ticketId`)
    REFERENCES `mydb`.`Tickets` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `commentsUser`
    FOREIGN KEY (`userId`)
    REFERENCES `mydb`.`Users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB

CREATE TABLE IF NOT EXISTS `mydb`.`Notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `message` VARCHAR(255) NOT NULL,
  `type` VARCHAR(45) NOT NULL,
  `isRead` TINYINT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `notificationUser_idx` (`userId` ASC) VISIBLE,
  CONSTRAINT `notificationUser`
    FOREIGN KEY (`userId`)
    REFERENCES `mydb`.`Users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB

CREATE TABLE IF NOT EXISTS `mydb`.`Statuses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB

CREATE TABLE IF NOT EXISTS `mydb`.`Categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB

CREATE TABLE IF NOT EXISTS `mydb`.`Roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB

CREATE TABLE IF NOT EXISTS `mydb`.`Priorities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB